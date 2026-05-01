import java.util.Scanner;

public class DailyQuest {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        String nome = "Cleyton";
        int nivel = 1;
        int xp = 0;

        String[] missoes = {
            "Estudar Java por 30 minutos",
            "Ir para academia",
            "Trabalhar"
        };

        boolean[] concluidas = {false, false, false};
        int recompensaXp = 250;

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

        scanner.close();
    }
}