# Daily Quest

Sua rotina diária como um **RPG pixelado**. Complete missões no horário, ganhe XP e ouro, evolua
atributos, derrote o chefe da semana (sozinho ou em dupla) e troque o ouro por recompensas reais.

O app é um **PWA** (Progressive Web App): roda no Safari do iPhone e pode ser instalado na Tela de
Início como um app de verdade, em tela cheia e funcionando offline. Não precisa de Mac, Xcode nem
conta paga de desenvolvedor Apple.

> O `DailyQuest.java` na raiz é a versão original de terminal que deu origem ao projeto.

## Funcionalidades

**Cadastro do herói** (7 etapas): nome, classe, visual, **rotina** (profissão e horários de acordar e
dormir), setores, objetivos e metas iniciais (água, peso, orçamento, sono).

**Agenda do dia**: a tela Hoje mostra as tarefas com horário em ordem, com a linha do "agora", as
atrasadas em laranja e o próximo compromisso. Tarefas feitas **no horário** (até 30 min depois) dão
**+20% de XP**. Concluir tudo do dia é um **Dia Perfeito** (+30 XP).

**Lembretes**: cada tarefa com horário pode avisar na hora ou 5, 15, 30 ou 60 min antes.

**Classes**

| Classe | Bônus |
|---|---|
| Guerreiro | +10% XP em Academia e Casa |
| Mago | +10% XP em Trabalho, Estudos e Conteúdo |
| Druida | +10% XP em Alimentação, Sono e Mente |
| Mercador | +10% de ouro em tudo e +10% XP em Financeiro |

**Setores e atributos**: cada setor evolui um atributo e tem um módulo próprio.

| Setor | Atributo | Módulo |
|---|---|---|
| Alimentação | VIT Vitalidade | Água, refeições saudáveis, peso |
| Academia | FOR Força | Registro de treinos, semana de treinos |
| Trabalho | FOC Foco | 3 prioridades do dia, Pomodoro |
| Financeiro | RIQ Riqueza | Receitas e gastos, saldo do mês, orçamento, gastos por categoria |
| **Conteúdo** *(extra)* | CRI Criatividade | Calendário de posts para social media (abaixo) |
| **Casa** *(extra)* | ORG Organização | Tarefas da casa, divididas com o grupo |
| Sono *(extra)* | ENE Energia | Horário de dormir/acordar, gráfico de 7 dias |
| Estudos *(extra)* | SAB Sabedoria | Pomodoro de estudos |
| Mente *(extra)* | ESP Espírito | Humor do dia, diário de bordo |
| Social *(extra)* | CAR Carisma | Ideias de missões, inclusive para o casal |

**Conteúdo (social media)**: cada post tem cliente/perfil, plataforma (Instagram, TikTok, YouTube,
LinkedIn...), formato (Reels, Carrossel, Stories, Live...), data, horário, lembrete, legenda/roteiro
(com botão "Copiar legenda") e status **Ideia › Produzindo › Pronto › Publicado**. Mostra atrasados,
hoje, próximos 14 dias, banco de ideias e o placar da semana. Os posts do dia entram na agenda, então
"postar isso a tal hora" vira uma missão com XP.

**Biblioteca de hábitos**: sugestões prontas por setor (social media, casa, casal, sono, finanças...)
com horário sugerido. Toque, ajuste e adicione.

**Missões**: diárias (com dias e horário), semanais, únicas (com prazo) e hábitos (+ bom / − ruim);
4 dificuldades; sequências até +50%; diárias não feitas tiram HP à meia-noite (no máximo metade do HP
por noite, e nada no Modo descanso).

**Objetivos**: metas de longo prazo, marco ou numéricas (ex.: juntar R$ 5.000), com prazo e missões ligadas.

**Grupo (jogar em dupla)**, com a nuvem opcional:
- perfis ao vivo da dupla (nível, HP, XP, progresso do dia, sequência, online);
- **missões da casa** compartilhadas: quem fizer primeiro ganha o XP; dá para definir quem faz;
- **chefe do grupo**: as missões dos dois causam dano no mesmo chefe, com placar de quem bateu mais;
- **incentivos** ("Tenho muito orgulho de você!") e **cura** (gaste ouro para recuperar o HP da dupla);
- **mural** com conquistas, níveis, dias perfeitos e tarefas da casa;
- privacidade: só o resumo do herói vai para o grupo (finanças, peso e diário ficam no aparelho).

**Conta e backup na nuvem**: com a conta, o progresso é salvo sozinho e volta em outro aparelho
("Já tenho conta"). Sem conta, há exportar/importar backup em arquivo.

**Herói**: perfil, atributos, estatísticas, **loja**, 31 conquistas, histórico (XP de 30 dias e mapa
de calor de 12 semanas) e configurações.

## Ativar a nuvem (grupo e backup)

Veja o passo a passo em **[docs/NUVEM.md](docs/NUVEM.md)**: criar um projeto gratuito no Firebase,
ativar o login por e-mail e o Firestore, publicar as regras de [`firestore.rules`](firestore.rules) e
colar a configuração no app.

## Como usar no iPhone

1. Publique o app (veja abaixo) e abra o link no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta para cima) › **Adicionar à Tela de Início**.
3. Abra sempre pelo ícone do Daily Quest.

No iPhone, o app da Tela de Início guarda os dados separado do Safari.

### Publicar com GitHub Pages (gratuito)

1. Faça merge desta branch na `main`.
2. No GitHub: **Settings › Pages › Build and deployment › Source: GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica a pasta `app/` automaticamente.
4. O endereço fica parecido com `https://<seu-usuario>.github.io/daily-quest-java/`.

> GitHub Pages em repositório privado exige plano pago. Alternativas grátis: deixar o repositório
> público, ou usar o Firebase Hosting (veja docs/NUVEM.md).

## Rodar no computador

Não há build nem dependências. Basta servir a pasta `app/`:

```bash
cd app
python3 -m http.server 8000
# abra http://localhost:8000
```

Ao publicar mudanças, aumente a versão do cache em `app/sw.js` (`daily-quest-v2` → `v3`).

## Estrutura

```
app/
  index.html, manifest.webmanifest, sw.js   página, instalação e modo offline
  css/style.css                              visual RPG pixelado
  fonts/, icons/                             fontes (licença OFL) e ícones
  vendor/firebase/                           SDK do Firebase (só carregado se a nuvem estiver ativa)
  js/
    app.js           inicialização, abas, eventos, lembretes
    data.js          setores, classes, biblioteca de hábitos, plataformas, conquistas, chefes
    game.js          regras: XP, níveis, HP, horários, posts, dia perfeito, chefe, conquistas
    agenda.js        agenda do dia e lembretes
    cloud.js         conta, backup, grupo, missões da casa, chefe do grupo, mural (Firebase)
    cloud-config.js  configuração do Firebase (opcional)
    store.js         estado salvo no aparelho (com migração de versões)
    sprites.js       pixel art (herói, chefes, ícones) em SVG
    sfx.js, ui.js, nav.js, dates.js
    screens/         hoje, missões, setores, conteúdo, biblioteca, grupo, loja, herói, cadastro
firestore.rules      regras de segurança da nuvem
firebase.json        configuração do Firebase (emulador e hosting)
docs/NUVEM.md        guia da nuvem
tools/               gerar ícones e atualizar o SDK do Firebase
```

## Próximos passos sugeridos

- **Notificações com o app fechado**: exige um servidor de push (Firebase Cloud Functions no plano Blaze).
- **App nativo na App Store**: empacotar este código com Capacitor (precisa de Mac + conta Apple Developer).
- **Integração com o app Saúde** (passos, sono, treinos): só em app nativo.
- **Backend em Java** (Spring Boot) no lugar do Firebase, aproveitando o início do projeto.
