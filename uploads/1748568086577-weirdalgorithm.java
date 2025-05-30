import java.util.Scanner;
public class weirdalgorithm{
    public static void main(String[] args){
        Scanner hariom=new Scanner(System.in);
        long n= hariom.nextInt();
        System.out.print(n);
        while(n!=1){
            if(n%2==0){
                n=n/2;
                System.out.print(" "+n);
            }
            else{
                n=n*3+1;
                System.out.print(" "+n);
            }
        }
    }
}