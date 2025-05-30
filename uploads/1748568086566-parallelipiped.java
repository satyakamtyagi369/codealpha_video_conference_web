import java.util.Scanner;
public class parallelipiped {
    public static void main(String[] args){
        Scanner hariom = new Scanner(System.in);
        int la= hariom.nextInt();
        int wa= hariom.nextInt();
        int ha= hariom.nextInt();
        /*int l = 1;
        int w = 1;
        int h = 1;
         la=l*h;
         wa=w*h;
         ha=l*w;
         if(la==wa){
            h = (int) Math.sqrt(ha);
           // System.out.println("Height: " + h);
            l=la/h;
            w=ha/l;
         }
        else if(wa==ha){
            l=(int) Math.sqrt(la);
          //  System.out.println("length: "+l);
            h=la/l;
            w=wa/h;
         }
        else if(la==ha){
            w=(int) Math.sqrt(wa);
          //  System.out.println("width: "+1);
            h=wa/w;
            l=la/h;
         }*/
        int l;
        int w;
        int h;
        h=((int)Math.sqrt((la*wa)/ha));
        l=la/h;
        w=wa/h;
         int sum= 4*(l+w+h);
         System.out.println(sum);
    }
}
