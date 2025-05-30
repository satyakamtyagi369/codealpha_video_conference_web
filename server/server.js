const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video_conference', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// File upload configuration
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Authentication Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        
        await user.save();
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token, user: { id: user._id, username, email } });
    } catch (error) {
        res.status(400).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token, user: { id: user._id, username: user.username, email } });
    } catch (error) {
        res.status(400).json({ error: 'Login failed' });
    }
});

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/${req.file.filename}`
    });
});

// Socket.IO connection handling
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        rooms.get(roomId).add(userId);
        
        socket.to(roomId).emit('user-connected', userId);
        
        // Send current whiteboard state to new user
        socket.to(roomId).emit('request-whiteboard-state');
    });

    // WebRTC signaling
    socket.on('signal', (data) => {
        socket.to(data.room).emit('signal', {
            signal: data.signal,
            from: socket.id
        });
    });

    // Whiteboard drawing
    socket.on('drawing', (data) => {
        socket.to(data.room).emit('drawing', data);
    });

    socket.on('whiteboard-state', (data) => {
        socket.to(data.room).emit('whiteboard-state', data);
    });

    // File sharing
    socket.on('file-shared', (data) => {
        socket.to(data.room).emit('file-shared', data);
    });

    // Chat messages
    socket.on('chat-message', (data) => {
        io.to(data.room).emit('chat-message', data);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove user from all rooms
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                socket.to(roomId).emit('user-disconnected', socket.id);
                if (users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});