import java.util.Scanner;
public class hexadecimalstheorm {
    public static void main(String[] args) {
        Scanner hariom =new Scanner(System.in);
        int n= hariom.nextInt();
        if(n==0){
            System.out.println("0 0 0");
        }
        else{
            System.out.println("0 0 "+n);
        }
    }
}
