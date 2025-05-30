// Global variables
let socket;
let localStream;
let peers = {};
let currentRoom = null;
let currentUser = null;
let mediaRecorder;
let recordedChunks = [];
let isDrawing = false;
let currentTool = 'pen';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
});

// Authentication functions
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        showApp();
        initializeSocket();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.username}`;
}

// Setup event listeners
function setupEventListeners() {
    // Auth form
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('toggle-auth').addEventListener('click', toggleAuthMode);
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Room controls
    document.getElementById('create-room-btn').addEventListener('click', createRoom);
    document.getElementById('join-room-btn').addEventListener('click', joinRoom);
    document.getElementById('share-screen-btn').addEventListener('click', shareScreen);
    document.getElementById('record-btn').addEventListener('click', toggleRecording);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Video controls
    document.getElementById('toggle-video').addEventListener('click', toggleVideo);
    document.getElementById('toggle-audio').addEventListener('click', toggleAudio);
    document.getElementById('end-call').addEventListener('click', endCall);
    
    // Whiteboard
    setupWhiteboard();
    
    // File upload
    document.getElementById('upload-btn').addEventListener('click', uploadFile);
    
    // Chat
    document.getElementById('send-message').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Authentication handlers
async function handleAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('auth-title').textContent === 'Login';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { username, email, password };
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            currentUser = data.user;
            showApp();
            initializeSocket();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Authentication failed');
    }
}

function toggleAuthMode() {
    const title = document.getElementById('auth-title');
    const submit = document.getElementById('auth-submit');
    const toggle = document.getElementById('toggle-auth');
    const username = document.getElementById('username');
    
    if (title.textContent === 'Login') {
        title.textContent = 'Register';
        submit.textContent = 'Register';
        toggle.textContent = 'Login';
        username.style.display = 'block';
        username.required = true;
    } else {
        title.textContent = 'Login';
        submit.textContent = 'Login';
        toggle.textContent = 'Register';
        username.style.display = 'none';
        username.required = false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) socket.disconnect();
    showAuth();
}

// Socket.IO initialization
function initializeSocket() {
    socket = io();
    
    socket.on('user-connected', (userId) => {
        console.log('User connected:', userId);
        connectToNewUser(userId);
    });
    
    socket.on('user-disconnected', (userId) => {
        if (peers[userId]) {
            peers[userId].close();
            delete peers[userId];
        }
    });
    
    socket.on('signal', (data) => {
        handleSignal(data);
    });
    
    socket.on('drawing', (data) => {
        drawOnCanvas(data);
    });
    
    socket.on('file-shared', (data) => {
        addFileToList(data);
    });
    
    socket.on('chat-message', (data) => {
        addChatMessage(data);
    });
}

// Room functions
function createRoom() {
    currentRoom = Math.random().toString(36).substr(2, 9);
    document.getElementById('room-id').value = currentRoom;
    joinRoom();
}

async function joinRoom() {
    const roomId = document.getElementById('room-id').value.trim();
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    
    currentRoom = roomId;
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        document.getElementById('local-video').srcObject = localStream;
        socket.emit('join-room', roomId, currentUser.id);
        
        // Enable controls
        document.getElementById('share-screen-btn').disabled = false;
        document.getElementById('record-btn').disabled = false;
        
        alert(`Joined room: ${roomId}`);
    } catch (error) {
        alert('Failed to access camera/microphone');
    }
}

// WebRTC functions
function connectToNewUser(userId) {
    const peer = createPeer(userId);
    peers[userId] = peer;
    
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });
}

function createPeer(userId) {
    const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', {
                room: currentRoom,
                signal: { ice: event.candidate },
                to: userId
            });
        }
    };
    
    peer.ontrack = (event) => {
        addRemoteVideo(event.streams[0], userId);
    };
    
    return peer;
}

function addRemoteVideo(stream, userId) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.id = `remote-${userId}`;
    document.getElementById('remote-videos').appendChild(video);
}

// Media controls
function toggleVideo() {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        document.getElementById('toggle-video').style.opacity = videoTrack.enabled ? '1' : '0.5';
    }
}

function toggleAudio() {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        document.getElementById('toggle-audio').style.opacity = audioTrack.enabled ? '1' : '0.5';
    }
}

async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        
        Object.values(peers).forEach(peer => {
            const sender = peer.getSenders().find(s => 
                s.track && s.track.kind === 'video'
            );
            if (sender) sender.replaceTrack(videoTrack);
        });
        
        videoTrack.onended = () => {
            // Switch back to camera
            const cameraTrack = localStream.getVideoTracks()[0];
            Object.values(peers).forEach(peer => {
                const sender = peer.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) sender.replaceTrack(cameraTrack);
            });
        };
    } catch (error) {
        alert('Screen sharing failed');
    }
}

function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('record-btn').textContent = 'Record';
    } else {
        startRecording();
        document.getElementById('record-btn').textContent = 'Stop Recording';
    }
}

function startRecording() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(localStream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
    };
    
    mediaRecorder.start();
}

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peers).forEach(peer => peer.close());
    peers = {};
    
    document.getElementById('remote-videos').innerHTML = '';
    document.getElementById('local-video').srcObject = null;
    document.getElementById('share-screen-btn').disabled = true;
    document.getElementById('record-btn').disabled = true;
    currentRoom = null;
}

// Whiteboard functions
function setupWhiteboard() {
    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    
    document.getElementById('pen-tool').addEventListener('click', () => setTool('pen'));
    document.getElementById('eraser-tool').addEventListener('click', () => setTool('eraser'));
    document.getElementById('clear-board').addEventListener('click', clearBoard);
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const color = document.getElementById('color-picker').value;
        const size = document.getElementById('brush-size').value;
        
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : color;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // Emit drawing data
        if (socket && currentRoom) {
            socket.emit('drawing', {
                room: currentRoom,
                x, y, color, size, tool: currentTool
            });
        }
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
}

function setTool(tool) {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tool}-tool`).classList.add('active');
}

function clearBoard() {
    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawOnCanvas(data) {
    const canvas = document.getElementById('whiteboard');
    const ctx = canvas.getContext('2d');
    
    ctx.lineWidth = data.size;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.tool === 'eraser' ? '#FFFFFF' : data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
}

// File functions
async function uploadFile() {
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    
    if (files.length === 0) {
        alert('Please select files to upload');
        return;
    }
    
    for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            if (response.ok) {
                addFileToList(data);
                if (socket && currentRoom) {
                    socket.emit('file-shared', { room: currentRoom, ...data });
                }
            }
        } catch (error) {
            alert('File upload failed');
        }
    }
    
    fileInput.value = '';
}

function addFileToList(file) {
    const fileList = document.getElementById('file-list');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <a href="${file.path}" target="_blank">${file.originalname}</a>
        <span>${new Date().toLocaleTimeString()}</span>
    `;
    fileList.appendChild(fileItem);
}

// Chat functions
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message && socket && currentRoom) {
        const messageData = {
            room: currentRoom,
            sender: currentUser.username,
            message: message,
            timestamp: new Date().toLocaleTimeString()
        };
        
        socket.emit('chat-message', messageData);
        input.value = '';
    }
}

function addChatMessage(data) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
        <div class="sender">${data.sender} - ${data.timestamp}</div>
        <div>${data.message}</div>
    `;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
}