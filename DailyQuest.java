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

        System.out.println();
        System.out.print("Digite o número do objetivo que deseja escolher: ");
        int objetivo = scanner.nextInt();

        int indice = objetivo - 1;

        if (indice >= 0 && indice < objetivos.length) {
            objetivosEscolhidos[indice] = true;
            System.out.println();
            System.out.println("Objetivo escolhido: " + objetivos[indice]);
        } else {
            System.out.println();
            System.out.println("Opção inválida.");
        }
        
    /*  int nivel = 1;
     *   int xp = 0;
     *   int recompensaXp = 250;

        int opcao;

        do {
            System.out.println("\n=== DAILY QUEST ===");
            System.out.println("1 - Ver status do jogador");
            System.out.println("2 - Ver missão do dia");
            System.out.println("3 - Concluir missão");
            System.out.println("0 - Sair");
            System.out.print("Escolha uma opção: ");

            opcao = scanner.nextInt();

            if (opcao == 1) {
                System.out.println("\nJogador: " + nome);
                System.out.println("Nível: " + nivel);
                System.out.println("XP: " + xp);
            } else if (opcao == 2) {
                for (int i = 0; i < missoes.length; i++) {
                    if (concluidas[i]) {
                        System.out.println((i + 1) + " - " + missoes[i] + " - Concluída");
                    } else {
                        System.out.println((i + 1) + " - " + missoes[i] + " - Pendente");
                    }
                }
            } else if (opcao == 3) {
                System.out.println("\nQual missão deseja concluir?");

                for (int i = 0; i < missoes.length; i++) {
                    System.out.println((i + 1) + " - " + missoes[i]);
                }

                System.out.print("Digite o número da missão: ");
                int escolha = scanner.nextInt();

                int indice = escolha - 1;

                if (indice >= 0 && indice < missoes.length) {
                    if (!concluidas[indice]) {
                        concluidas[indice] = true;
                        xp += recompensaXp;

                        System.out.println("\nMissão concluída: " + missoes[indice]);
                        System.out.println("Você ganhou " + recompensaXp + " XP.");

                        while (xp >= 100) {
                            nivel++;
                            xp -= 100;
                            System.out.println("Parabéns! Você subiu para o nível " + nivel + "!");
                        }
                    } else {
                        System.out.println("\nEssa missão já foi concluída.");
                    }
                } else {
                    System.out.println("\nMissão inválida.");
                }
            } else if (opcao == 0) {
                System.out.println("\nSaindo do Daily Quest...");
            } else {
                System.out.println("Opção inválida.");
            }
        } while (opcao != 0);
    */
        scanner.close();
    }
}