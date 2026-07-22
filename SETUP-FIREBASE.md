# Como ativar o acesso por PIN em qualquer aparelho

Sem isso, o app funciona normalmente com PIN, mas cada aparelho terá seu próprio PIN/dados. Com isso, o mesmo PIN abre os mesmos dados em qualquer celular ou computador.

## 1. Criar o projeto (grátis)
1. Acesse https://console.firebase.google.com
2. "Adicionar projeto" → dê um nome (ex.: `maryeve-atelier`) → pode desativar o Google Analytics → Criar.

## 2. Registrar o app da web
1. Na tela do projeto, clique no ícone `</>` (Web).
2. Dê um apelido (ex.: `maryeve-web`) → Registrar app.
3. Copie o objeto `firebaseConfig` que aparece.
4. Cole os valores no arquivo **firebase-config.js**, substituindo cada `"COLE_AQUI"`.

## 3. Ativar o Firestore
1. Menu lateral → Build → **Firestore Database** → Criar banco de dados.
2. Escolha o modo **produção** e a região mais próxima (ex.: `southamerica-east1`).

## 4. Ativar login anônimo
1. Menu lateral → Build → **Authentication** → Get started.
2. Aba "Sign-in method" → **Anônimo** → Ativar.

## 5. Colar as regras de segurança
Em Firestore Database → aba **Regras**, substitua tudo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /appdata/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Publique as regras.

## 6. (Opcional, recomendado) Trocar o "código secreto" do documento
No arquivo **firebase-config.js**, troque o valor de `FIRESTORE_DOC_ID` por algo só seu (ex.: `atelier-maryeve-2026-xyz`). Isso funciona como uma segunda camada além do PIN.

## Importante sobre segurança
O PIN protege o **acesso pela tela do app**, mas as regras acima liberam o documento para qualquer usuário anônimo autenticado nesse projeto Firebase — ou seja, a proteção real depende do PIN em si e do sigilo do `FIRESTORE_DOC_ID`, não de uma senha de servidor. Para os dados de um ateliê pessoal isso costuma ser suficiente, mas não é nível bancário — evite guardar dados extremamente sensíveis.

## Pronto!
Depois de preencher `firebase-config.js`, é só subir os arquivos (`index.html`, `style.css`, `app.js`, `auth.js`, `firebase-config.js`) para o GitHub Pages (ou onde já estava hospedado). Ao abrir, você vai criar seu PIN na primeira vez — e poderá usar o mesmo PIN em qualquer outro aparelho.
