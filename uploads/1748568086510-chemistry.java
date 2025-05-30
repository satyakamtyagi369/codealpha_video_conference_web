
import java.util.Scanner;

public class chemistry {
    public static void main(String[] args) {
        Scanner hariom = new Scanner(System.in);
        int t=hariom.nextInt();
        while(t-->0){
            int n= hariom.nextInt();
            int k= hariom.nextInt();
            String s= hariom.next();
            int frequency[]= new int[26];
            for(int i=0;i<n;i++){
                char c= s.charAt(i);
                frequency[c - 'a']++;
            }
            int countodd=0;
            for(int i=0;i<26;i++){
                if(frequency[i]%2!=0){
                    countodd++;
                }
            }
            if(countodd-1>k){
                System.out.println("NO");
            }
            else{
                System.out.println("YES");
            }
        }
    }
}
