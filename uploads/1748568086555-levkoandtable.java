import java.util.*;
public class levkoandtable {
    public static void main(String[] args){
        Scanner hariom = new Scanner(System.in);
        int n = hariom.nextInt();
        int k = hariom.nextInt();
        for(int i=0;i<n;i++){
            for(int j=0;j<n;j++){
                if(i==j){
                    System.out.print(k+" ");
                }
                else{
                    System.out.print("0 ");
                }
            }
            System.out.println();
        }
    }
}
