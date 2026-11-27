# Nuvem: conta, backup e jogar em dupla

O Daily Quest funciona 100% no aparelho, sem conta. A **nuvem é opcional** e libera:

- **Grupo** (para você e sua companheira, ou amigos, até 8 pessoas): perfis ao vivo, missões da casa
  compartilhadas, chefe semanal em conjunto, mural, incentivos e cura.
- **Backup automático** do seu progresso, com recuperação em outro aparelho (botão "Já tenho conta").

A nuvem usa o **Firebase**, do Google, no plano gratuito (Spark). Não pede cartão de crédito. Para um
casal, o uso fica muito abaixo dos limites grátis (50 mil leituras e 20 mil gravações por dia).

Só **quem cria o grupo** faz a configuração abaixo, uma única vez (uns 10 minutos).

## 1. Criar o projeto

1. Acesse <https://console.firebase.google.com> com sua conta Google.
2. **Criar um projeto** › dê um nome (ex.: `daily-quest-casa`) › pode desativar o Google Analytics › **Criar projeto**.

## 2. Ativar o login por e-mail

1. No menu lateral: **Criação › Authentication** › **Vamos começar**.
2. Aba **Método de login** › **E-mail/senha** › ative a primeira chave › **Salvar**.

## 3. Criar o banco de dados (Firestore)

1. Menu lateral: **Criação › Firestore Database** › **Criar banco de dados**.
2. Local: **southamerica-east1 (São Paulo)**.
3. Escolha **Iniciar no modo de produção** › **Criar**.

## 4. Publicar as regras de segurança

As regras garantem que cada pessoa só veja os próprios dados e que só membros vejam o grupo.

1. No Firestore, abra a aba **Regras**.
2. Apague o que estiver lá e cole **todo** o conteúdo do arquivo [`firestore.rules`](../firestore.rules) deste repositório.
3. Clique em **Publicar**.

## 5. Registrar o app da Web e copiar a configuração

1. Clique na engrenagem ao lado de **Visão geral do projeto** › **Configurações do projeto**.
2. Em **Seus apps**, clique no ícone **`</>`** (Web).
3. Apelido: `daily-quest` (não precisa marcar o Firebase Hosting) › **Registrar app**.
4. Copie o bloco que aparece, parecido com:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "daily-quest-casa.firebaseapp.com",
  projectId: "daily-quest-casa",
  storageBucket: "daily-quest-casa.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123"
};
```

Esses valores **não são senhas**: o Google os considera públicos. Quem protege os dados são as regras do passo 4.

## 6. Colocar a configuração no app

Escolha **uma** das opções:

**A) Recomendado: deixar fixo no código.** Cole o objeto em [`app/js/cloud-config.js`](../app/js/cloud-config.js)
(no lugar de `null`) e publique o app. Assim, quem instalar o app já vem com a nuvem pronta e só precisa
digitar o código do grupo. Se preferir, mande o bloco para o Claude que ele coloca no arquivo.

**B) Direto no app, sem mexer no código.** Aba **Grupo** › **Configurar a nuvem** › cole o bloco › **Salvar e conectar**.
Nesse caso, o link de convite leva a configuração junto (veja abaixo).

## 7. Criar sua conta e o grupo

1. Aba **Grupo** › **Criar conta** (e-mail e senha).
2. **Criar grupo** › dê um nome (ex.: "Casa Cleyton & Ana").
3. Toque em **Convidar** e mande o link/código pelo WhatsApp.

## Para a sua companheira

1. Abrir o link do app no **Safari** do iPhone › **Compartilhar** › **Adicionar à Tela de Início**.
2. Abrir o Daily Quest **pelo ícone** e criar o herói dela.
3. Aba **Grupo**:
   - se você usou a opção **A**: **Criar conta** e depois **Entrar com código**;
   - se você usou a opção **B**: **Configurar a nuvem** › colar o **link do convite** que você mandou › **Criar conta** (ela entra no grupo automaticamente).

> Por que abrir pelo ícone? No iPhone, o app da Tela de Início guarda os dados separado do Safari.
> O que for feito no Safari não aparece no app instalado.

## Lembretes no iPhone

- Tarefas com horário mostram um lembrete com o app aberto e, se você permitir (Herói › Config ›
  Notificações), uma notificação quando o app acabou de ir para o fundo.
- Com o app **totalmente fechado**, o iPhone não deixa sites agendarem alertas sozinhos. Para isso seria
  preciso um servidor de notificações (Firebase Cloud Functions, que exige o plano pago Blaze, ainda que
  com uso gratuito). É um próximo passo possível.

## Publicar o app

- **GitHub Pages**: veja o README (o repositório precisa ser público no plano grátis do GitHub).
- **Firebase Hosting** (funciona com repositório privado): no computador, com Node.js instalado:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # escolha o projeto criado acima
firebase deploy --only hosting,firestore:rules
```

O endereço fica `https://SEU-PROJETO.web.app`.

## Testar localmente com o emulador (para desenvolvedores)

```bash
npm install -g firebase-tools
firebase emulators:start --only auth,firestore --project demo-dailyquest
cd app && python3 -m http.server 8765
```

No app, em **Configurar a nuvem**, cole:

```json
{"apiKey":"demo-key","authDomain":"demo-dailyquest.firebaseapp.com","projectId":"demo-dailyquest","appId":"1:1:web:1",
 "emulator":{"auth":"http://127.0.0.1:9099","host":"127.0.0.1","port":8080}}
```
