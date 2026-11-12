// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ------------------------------------------------------------
// Enquanto FIREBASE_CONFIG for null, o app roda em MODO DEMONSTRAÇÃO:
// tudo fica salvo só no navegador deste aparelho (bom para testar).
//
// Para colocar no ar de verdade, cole aqui a configuração do seu
// projeto Firebase (Console > Configurações do projeto > Seus apps > Web).
// Veja o passo a passo no arquivo LEIA-ME.md.
// ============================================================

window.FIREBASE_CONFIG = null;

/* Exemplo (troque pelos seus dados):
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "ponte-solidaria.firebaseapp.com",
  projectId: "ponte-solidaria",
  storageBucket: "ponte-solidaria.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxx"
};
*/

// Tamanho máximo por arquivo enviado (em MB)
window.MAX_FILE_MB = 50;
