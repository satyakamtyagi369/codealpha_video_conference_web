import java.util.*;
public class airport {
    public static void main(String[] args) {
        Scanner hariom = new Scanner(System.in);
        int n= hariom.nextInt();
        int m= hariom.nextInt();
        Integer seats[] = new Integer[m];
        for(int i=0;i<m;i++){
            seats[i]=hariom.nextInt();
        }
        int maximum=0;
        int minimum=0;
        Integer maxseats[]=seats.clone();
        int a=0;
        for(int i=0;i<n;i++){
           // System.out.println("i:"+i);
            Arrays.sort(maxseats, Collections.reverseOrder());
            if(maxseats[a]==0){
                a++;
            }
            maximum=maximum + maxseats[a];
          //  System.out.println("maximum:"+maximum);
            maxseats[a]--;
           // System.out.println("maxseats:"+maxseats[a]);
        }
        
        Integer minseats[]= seats.clone();
        int b=0;
        for(int i=0;i<n;i++){
            Arrays.sort(minseats);
            if(minseats[b]==0){
                b++;
            }
            minimum=minimum + minseats[b];
            minseats[b]--;
        }
        System.out.println(maximum+" "+minimum);
    }
}
