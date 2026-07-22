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
    apiKey: "AIzaSyCKiX1z4911pcqmW-YBIlM8pS_4bh8tdKk",
  authDomain: "maryeve-cb30a.firebaseapp.com",
  projectId: "maryeve-cb30a",
  storageBucket: "maryeve-cb30a.firebasestorage.app",
  messagingSenderId: "346433682744",
  appId: "1:346433682744:web:b620108998695552fa15cd"
};

const FIRESTORE_DOC_ID = "maryeve-atelier-troque-isto";
