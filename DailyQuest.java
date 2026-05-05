import java.util.Scanner;

public class DailyQuest {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        System.out.println("=== BEM-VINDO JOGADOR! ===");
        System.out.println();
        System.out.println("Antes de começar vamos, criar seu perfil");
        System.out.println();
        System.out.print("Qual o seu nome de jogador? ");   

        String nome = scanner.nextLine();

        System.out.println();

        
        System.out.printf("Certo %s, agora me diz, quais objetivos você quer focar?\n", nome);
        System.out.println();

        String[] objetivos = {
            "Estudar mais",
            "Treinar com consistência",
            "Organizar minha rotina",
            "Ser mais produtivo no trabalho",
            "Melhorar hábitos de saúde"
        };

        boolean[] objetivosEscolhidos = {false, false, false, false, false};

        for (int i = 0; i < objetivos.length; i++) {
            System.out.println((i + 1) + " - " + objetivos[i]);
        }

        boolean escolheuAlgumObjetivo = false;

        int objetivo;

        do {
            System.out.println();
            System.out.print("Digite o número do objetivo que deseja escolher ou 0 para finalizar: ");
            objetivo = scanner.nextInt();

            if (objetivo == 0) {
                if (escolheuAlgumObjetivo) {
                    System.out.println("\nFinalizando escolhas de objetivos...");
                } else { 
                    System.out.println("\n⚠️ Você ainda não escolheu nenhum objetivo.");
                    System.out.println("Escolha pelo menos um para continuar sua jornada.");
                    objetivo = -1;
                }
            } else {
                int indice = objetivo - 1;
                
                

                if (indice >= 0 && indice < objetivos.length) {
                    if (!objetivosEscolhidos[indice]) {
                        objetivosEscolhidos[indice] = true;
                        escolheuAlgumObjetivo = true;

                        System.out.println();
                        System.out.println("Objetivo escolhido: " + objetivos[indice]);
                    } else {
                        System.out.println("Esse objetivo já foi escolhido.");
                    }
                } else {
                    System.out.println();
                    System.out.println("Opção inválida.");
                }
            }
        } while (objetivo != 0);

        System.out.println("\n✅ Perfil criado com sucesso!");
        System.out.println("Jogador: " + nome);
        
        System.out.println("\n🎯 Seus objetivos:");

        for (int i = 0; i < objetivos.length; i++) {
            if (objetivosEscolhidos[i]) {
                System.out.println("- " + objetivos[i]);
            }
        }
        scanner.close();
    }
}