# Ponte Solidária — como testar e publicar

App web (funciona no celular e no computador) que pode ser instalado como aplicativo
e depois enviado para a Google Play Store.

## O que já está pronto

- Escolha de idioma na abertura (39 idiomas na lista; telas completas em português, inglês, espanhol e francês; os demais usam inglês até serem traduzidos)
- Botão **Ajuda** em todas as telas, com leitura em voz alta e compatível com TalkBack/VoiceOver
- Tamanho de texto ajustável (Ajustes)
- Cadastro de doador e de beneficiário (e-mail e senha, ou conta Google)
- Perfil do beneficiário com história, meta, chave Pix e comprovações (fotos, PDF e links de vídeo), com opção de deixar visível só para quem tem conta
- Moderação: o perfil só aparece depois de aprovado por um moderador
- Doação via Pix direto para a pessoa: o doador registra, a pessoa confirma e o valor entra na meta
- Linha do tempo com doações, prestação de contas (com nota fiscal) e conquistas
- "Corrente do bem": o beneficiário marca quando passa a ajudar outras pessoas
- Funciona com internet fraca (service worker) e pode ser instalado na tela inicial

## Os dois modos de uso

Depois do idioma, o app pergunta como a pessoa quer usar (dá para trocar em Ajustes):

1. **Modo Áudio (deficiência visual)**: a tela é dividida em dois botões grandes. A metade de cima é este modo, e o app fala a pergunta em voz alta.
   - Toda tela é narrada ao abrir (nomes, metas, valores, instruções).
   - Botão grande **Falar** no canto de baixo: a pessoa toca e fala um comando.
   - Comandos em português: *início, minha área, ajustes, idioma, voltar, ler, ajuda, parar,
     linha do tempo, doar, abrir Maria* (ou só o nome), *valor 50, copiar chave, confirmar,
     próximo campo, campo anterior, escrever …, apagar, marcar, enviar, modo leitura*.
   - Preencher cadastro por voz: "próximo campo" → "escrever Joana Silva" → "próximo campo" →
     "escrever joana arroba gmail ponto com" → … → "criar conta".
   - Comandos também em inglês, espanhol e francês.
2. **Ler e Preencher**: a pessoa lê e preenche normalmente; o áudio só toca ao apertar **Ajuda**.

Observações:
- O reconhecimento de voz funciona no **Google Chrome do Android** (e, portanto, no app da
  Play Store). Ele precisa de internet e da permissão do microfone. No iPhone o suporte é parcial.
- Quem já usa TalkBack/VoiceOver pode preferir "Ler e Preencher", para não ouvir duas vozes.

## Modo demonstração

Com `js/config.js` do jeito que está (`FIREBASE_CONFIG = null`), tudo fica salvo só no
navegador de cada pessoa, e o app começa **vazio** (sem pessoas fictícias). Para testar o
fluxo completo: crie uma conta de beneficiário, preencha o perfil, e em
**Minha área → Entrar** use o botão **Moderação (teste)** para aprovar. Depois crie outra
conta como doador. Fotos são reduzidas automaticamente; vídeo só por link.

Para testar no computador, abra a pasta no VS Code e use a extensão **Live Server**
(o app precisa ser aberto por um endereço `http://`, não com duplo clique).

---

## Passo a passo para colocar no ar — 100% GRÁTIS (Firebase Spark + GitHub Pages)

Nada aqui pede cartão. **Não ative o plano Blaze nem o Storage.**
Projeto Firebase: `ponte-solidaria-769e5` · Repositório: `igororcobras-hash/ponte-solidaria`.

### 1. Ligar o site no GitHub Pages
- Link: https://github.com/igororcobras-hash/ponte-solidaria/settings/pages
- Arquivo: nenhum.
- Em **Build and deployment → Source: Deploy from a branch**, escolha **main** e **/ (root)** → **Save**. Espere 1–2 minutos.
- O site fica em https://igororcobras-hash.github.io/ponte-solidaria/

### 2. Ativar o login
- Link: https://console.firebase.google.com/project/ponte-solidaria-769e5/authentication/providers
- Ative **E-mail/senha** e **Google**.
- Link: https://console.firebase.google.com/project/ponte-solidaria-769e5/authentication/settings → **Domínios autorizados → Adicionar**: `igororcobras-hash.github.io`

### 3. Criar o banco de dados (grátis)
- Link: https://console.firebase.google.com/project/ponte-solidaria-769e5/firestore
- **Criar banco de dados → modo produção → região `southamerica-east1`**.
- Aba **Regras**: https://console.firebase.google.com/project/ponte-solidaria-769e5/firestore/rules — apague tudo, cole o conteúdo do arquivo **`firestore.rules`** (https://raw.githubusercontent.com/igororcobras-hash/ponte-solidaria/main/firestore.rules) e clique **Publicar**.

### 4. Registrar o app Web e copiar a configuração
- Link: https://console.firebase.google.com/project/ponte-solidaria-769e5/settings/general
- Arquivo: **`js/config.js`** — editar em https://github.com/igororcobras-hash/ponte-solidaria/edit/main/js/config.js
- Em **Seus apps → Web (</>)** registre o app (apelido `ponte`, **sem** Firebase Hosting) e copie o bloco `firebaseConfig`.
- Cole no lugar de `window.FIREBASE_CONFIG = null;`: `window.FIREBASE_CONFIG = { apiKey: "...", ... };` e clique **Commit changes**.
- (A chave `apiKey` do Firebase Web não é segredo; a proteção está nas regras do passo 3.)

### 5. Criar o primeiro moderador
- Crie sua conta pelo próprio app. Copie seu UID em https://console.firebase.google.com/project/ponte-solidaria-769e5/authentication/users
- Link: https://console.firebase.google.com/project/ponte-solidaria-769e5/firestore/data → **Iniciar coleção** `admins` → ID do documento = seu UID (um campo qualquer, ex.: `ativo` = true).

### Limites do plano grátis
- Fotos são reduzidas para ~300 KB e guardadas no banco; PDF até 600 KB; **vídeo só por link** (YouTube "não listado" ou Google Drive).
- Firestore grátis: 1 GiB, 50 mil leituras e 20 mil gravações por dia. Auth: 50 mil usuários ativos/mês.

---

## Google Play (opcional, depois que o site estiver no ar)

### 6. Conta de desenvolvedor Google Play **(pago: taxa única de US$ 25)**
- Link: https://play.google.com/console/signup
- Arquivo: nenhum (pedem documento de identidade e verificação).

### 7. Gerar o app Android
- Link: https://www.pwabuilder.com
- Arquivo: o endereço do site (`https://igororcobras-hash.github.io/ponte-solidaria/`).
- Clique em **Package for stores → Android** e baixe o pacote. Ele traz:
  - o arquivo **`.aab`** (vai para a Play Store);
  - o arquivo **`assetlinks.json`**: coloque-o na pasta **`.well-known/`** deste projeto
    e envie ao GitHub (Add file → Upload files) (isso tira a barra do navegador de dentro do app).
  - Guarde a **chave de assinatura** que vem junto: sem ela não dá para atualizar o app depois.

### 8. Teste fechado obrigatório
- Link: https://play.google.com/console
- Arquivo: o **`.aab`** do passo 9.
- Contas pessoais novas precisam de **12 testadores por 14 dias seguidos** antes de publicar.
- Na Play Console: **Testar → Teste fechado → Criar versão**, envie o `.aab` e adicione os e-mails dos testadores.

### 9. Publicar
- Link: https://play.google.com/console
- Arquivos: o mesmo **`.aab`**, os ícones da pasta **`icons/`** e prints das telas.
- Peça **acesso à produção**, preencha a ficha da loja, a política de privacidade e a classificação de conteúdo.

### iPhone (opcional) **(pago: US$ 99 por ano)**
- Link: https://developer.apple.com/programs/
- Enquanto isso, no iPhone dá para instalar pelo Safari: **Compartilhar → Adicionar à Tela de Início**.

---

## Antes de lançar de verdade

- **Dinheiro:** o app não recebe nem guarda dinheiro; o Pix vai direto do doador para o beneficiário.
  A política do Google Play dispensa a cobrança da loja para pagamentos entre pessoas e
  doações isentas de impostos, mas confirme com um advogado ou contador, e de
  preferência tenha uma ONG parceira na moderação.
- **LGPD:** documentos e situação financeira são dados sensíveis. Escreva uma política de
  privacidade e um termo de consentimento antes de abrir para o público.
- **Valores arrecadados:** hoje o próprio beneficiário confirma as doações. Para mais segurança,
  o próximo passo é mover essa confirmação para uma Cloud Function.
- **Tradução:** para completar um idioma, copie o bloco `STR.en` em `js/i18n.js`, troque o
  código (ex.: `STR.de`), traduza e adicione o código em `UI_OF`.
