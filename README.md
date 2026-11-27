# Daily Quest

Sua rotina diária como um **RPG pixelado**. Complete missões, ganhe XP e ouro, evolua atributos,
derrote o chefe da semana e troque o ouro por recompensas reais.

O app é um **PWA** (Progressive Web App): roda no Safari do iPhone e pode ser instalado na Tela de
Início como um app de verdade, em tela cheia e funcionando offline. Não precisa de Mac, Xcode nem
conta paga de desenvolvedor Apple.

> O `DailyQuest.java` na raiz é a versão original de terminal que deu origem ao projeto.

## Funcionalidades

**Cadastro do herói** (em 6 etapas): nome, classe, visual (pele, cabelo, roupa), setores da rotina,
objetivos e metas iniciais (água, peso, orçamento, sono).

**Classes**

| Classe | Bônus |
|---|---|
| Guerreiro | +10% XP em Academia |
| Mago | +10% XP em Trabalho e Estudos |
| Druida | +10% XP em Alimentação, Sono e Mente |
| Mercador | +10% de ouro em tudo e +10% XP em Financeiro |

**Setores e atributos**: cada setor evolui um atributo e tem um módulo próprio.

| Setor | Atributo | Módulo |
|---|---|---|
| Alimentação | VIT Vitalidade | Contador de água, refeições saudáveis, registro de peso |
| Academia | FOR Força | Registro de treinos (tipo, duração, intensidade), semana de treinos |
| Trabalho | FOC Foco | 3 prioridades do dia, timer Pomodoro |
| Financeiro | RIQ Riqueza | Receitas e gastos, saldo do mês, orçamento, gastos por categoria |
| Sono *(extra)* | ENE Energia | Horário de dormir/acordar, gráfico de 7 dias |
| Estudos *(extra)* | SAB Sabedoria | Pomodoro de estudos |
| Mente *(extra)* | ESP Espírito | Humor do dia, diário de bordo |
| Social *(extra)* | CAR Carisma | Ideias de missões sociais |

**Missões**
- **Diárias** (com dias da semana), **semanais**, **únicas** (com prazo) e **hábitos** (+ bom / − ruim).
- 4 dificuldades: Fácil, Médio, Difícil e Épico, com XP, ouro e pontos de atributo diferentes.
- **Sequências**: cada dia seguido aumenta o XP e o ouro (até +50%).
- **Relatório da noite**: diárias não feitas tiram HP à meia-noite (no máximo metade do HP por noite).
  Com o **Modo descanso** ligado, nada tira HP.
- Se o HP zerar, o herói desmaia: perde 25% do ouro e o XP do nível atual.

**Objetivos**: metas de longo prazo, do tipo marco (sim/não) ou numéricas (ex.: juntar R$ 5.000,
perder 5 kg), com prazo, barra de progresso e missões ligadas. Concluir dá 150 XP e 75 de ouro.

**Chefe semanal**: toda segunda-feira surge um chefe (Dragão da Procrastinação, Golem do Sedentarismo,
Slime do Açúcar...). Cada missão concluída causa dano igual ao XP ganho. Derrotá-lo dá bônus.

**Loja**: poções de vida e recompensas reais personalizadas (episódio de série, delivery, dia de folga...).

**Herói**: perfil, atributos, estatísticas, 22 conquistas, histórico de XP (30 dias), mapa de calor
de missões (12 semanas) e configurações (sons 8-bit, metas, setores, backup).

## Como usar no iPhone

1. Publique o app (veja abaixo) e abra o link no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta para cima).
3. Toque em **Adicionar à Tela de Início**.
4. Abra pelo ícone do Daily Quest.

Os dados ficam salvos **somente no aparelho**. Use *Herói > Config > Backup > Exportar* de vez em
quando para guardar uma cópia (dá para salvar no app Arquivos/iCloud Drive).

### Publicar com GitHub Pages (gratuito)

1. Faça merge desta branch na `main`.
2. No GitHub: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica a pasta `app/` automaticamente.
4. O endereço fica parecido com `https://<seu-usuario>.github.io/daily-quest-java/`.

> GitHub Pages em repositório privado exige plano pago. Se o repositório for privado, deixe-o
> público ou use outra hospedagem estática gratuita (Netlify, Vercel, Cloudflare Pages) apontando
> para a pasta `app/`.

## Rodar no computador

Não há build nem dependências. Basta servir a pasta `app/`:

```bash
cd app
python3 -m http.server 8000
# abra http://localhost:8000
```

Para testar no iPhone na mesma rede Wi-Fi, abra `http://<ip-do-computador>:8000` no Safari.
(O modo offline/instalação completo exige HTTPS, que o GitHub Pages já fornece.)

Ao publicar mudanças, aumente a versão do cache em `app/sw.js` (`daily-quest-v1` → `v2`).

## Estrutura

```
app/
  index.html              página única do app
  manifest.webmanifest    dados para instalar como app
  sw.js                   service worker (offline)
  css/style.css           visual RPG pixelado
  fonts/                  Press Start 2P e VT323 (licença OFL)
  icons/                  ícones do app
  js/
    app.js                inicialização, abas e eventos
    data.js               setores, classes, objetivos sugeridos, conquistas, chefes
    game.js               regras: XP, níveis, HP, sequências, chefe, conquistas, virada do dia
    store.js              estado salvo no localStorage, backup
    sprites.js            pixel art (herói, chefes, ícones) gerada em SVG
    sfx.js                sons 8-bit com Web Audio
    ui.js                 componentes: barras, modais, toasts
    screens/              telas: cadastro, hoje, missões, setores, loja, herói
tools/gen-icons.cjs       gera os ícones PNG a partir do sprite
```

## Próximos passos sugeridos

- **App nativo na App Store**: empacotar este mesmo código com [Capacitor](https://capacitorjs.com)
  (precisa de um Mac com Xcode e conta Apple Developer) ou reescrever em SwiftUI.
- **Notificações**: lembretes de água, treino e hora de dormir (no iOS, Web Push funciona em PWAs
  instalados a partir do iOS 16.4, mas exige um pequeno servidor).
- **Sincronização na nuvem e login**: um backend (pode ser em Java com Spring Boot, aproveitando o
  início do projeto) para salvar o progresso e usar em vários aparelhos.
- **Integração com o app Saúde** (passos, sono, treinos): só é possível em app nativo.
- **Modo grupo**: amigos enfrentando o mesmo chefe semanal.
