import java.util.Scanner;

public class iloveusername {
    public static void main(String[] args) {
        Scanner hariom = new Scanner(System.in);
        int n = hariom.nextInt();
        int arr[] = new int[n];
        
        for (int i = 0; i < n; i++) {
            arr[i] = hariom.nextInt();
        }
        
        int maxScore = arr[0];
        int minScore = arr[0];
        int amazingCount = 0;
        
        for (int i = 1; i < n; i++) {
            if (arr[i] > maxScore) {
                maxScore = arr[i];
                amazingCount++;
            } else if (arr[i] < minScore) {
                minScore = arr[i];
                amazingCount++;
            }
        }
        
        System.out.println(amazingCount);
    }
}
