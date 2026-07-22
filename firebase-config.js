// ============================================================
// CONFIGURAÇÃO DO FIREBASE — preencha com as chaves do SEU projeto
// ============================================================
// Onde pegar isso:
// 1. Acesse https://console.firebase.google.com e crie um projeto (grátis).
// 2. No menu do projeto, clique no ícone "</>" (Web app) para registrar um app da web.
// 3. Copie o objeto "firebaseConfig" que aparece e cole os valores abaixo.
// 4. Ative o Firestore Database (modo produção) em Build > Firestore Database.
// 5. Ative Authentication > Sign-in method > Anônimo (Anonymous).
// 6. Em Firestore > Regras, cole as regras que te enviei no chat.
//
// FIRESTORE_DOC_ID: escolha uma palavra/código único e "secreto" (ex: nome do ateliê + números).
// Ele funciona como um segundo fator além do PIN — troque o valor abaixo por algo só seu.

const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

const FIRESTORE_DOC_ID = "maryeve-atelier-troque-isto";
