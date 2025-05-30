import java.util.Scanner;
public class atcodersb {
    public static void main(String[] args) {
        Scanner hariom = new Scanner(System.in);
        long n= hariom.nextLong();
        long arr[]=new long[(int)n];
        for(int i=0;i<n;i++){
            arr[i]=hariom.nextLong();
        }
        boolean result= true;
        float ratio= arr[1]/arr[0];
        for(int i=0;i<n-1;i++){
            
            if(arr[i+1]/arr[i]!=ratio){
                result = false;
            }
        }
        if(result){
            System.out.println("YES");
        }
        else{
            System.out.println("NO");
        }
    }
}
