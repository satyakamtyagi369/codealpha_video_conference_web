import java.util.Scanner;
public class youngphysicist{

    public static void main(String[] args){
        Scanner hariom = new Scanner(System.in);
        
        int n= hariom.nextInt();
        int x[]=new int[n];
        int y[]=new int[n];
        int z[]=new int[n];
        for(int j=0;j<n;j++){
            x[j]=hariom.nextInt();
            y[j]=hariom.nextInt();
            z[j]=hariom.nextInt();
        }int sumx=0;
        int sumy=0;
        int sumz=0;
        for(int j=0;j<n;j++){
            sumx=sumx + x[j];
            sumy=sumy + y[j];
            sumz=sumz + z[j];
        }
        if(sumx==0 && sumy==0 &&sumz==0){
            System.out.println("YES");
        }
        else{
            System.out.println("NO");
        }
    }
}