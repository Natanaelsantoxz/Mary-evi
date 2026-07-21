# maryéve atelier — ordens de serviço & estoque

Sistema simples, em uma página, para o ateliê controlar:

- **Ordens de serviço**: cliente, contato, defeito/serviço, valor, datas, status e se já foi pago.
- **Estoque**: tecidos, linhas e aviamentos, com quantidade e valor.
- **Faturamento**: total já faturado, total a receber, valor parado em estoque e gráfico por mês.

Feito em HTML, CSS e JavaScript puro — não precisa de servidor, banco de dados ou instalação. Os dados ficam salvos no navegador (`localStorage`) do computador ou celular onde o site for aberto.

## Como usar agora mesmo

Basta abrir o arquivo `index.html` em qualquer navegador (duplo clique nele).

## Como publicar no GitHub (grátis, com link próprio)

1. Crie um repositório novo no GitHub, por exemplo `maryeve-atelier`.
2. Envie estes arquivos (`index.html`, `style.css`, `app.js`, `README.md`) para o repositório:
   - Pelo site do GitHub: abra o repositório → **Add file → Upload files** → arraste os arquivos → **Commit changes**.
   - Ou pelo terminal:
     ```bash
     git init
     git add .
     git commit -m "Sistema de ordens e estoque do ateliê"
     git branch -M main
     git remote add origin https://github.com/SEU-USUARIO/maryeve-atelier.git
     git push -u origin main
     ```
3. No repositório, vá em **Settings → Pages**.
4. Em **Source**, escolha a branch `main` e a pasta `/ (root)` → **Save**.
5. Em alguns minutos o GitHub mostra o link do site, algo como:
   `https://SEU-USUARIO.github.io/maryeve-atelier/`

Esse link pode ser salvo na tela inicial do celular, funcionando quase como um aplicativo.

## Importante sobre os dados

- Os dados ficam guardados **no navegador de cada aparelho** — se abrir em outro celular ou computador, os registros não aparecem lá (cada aparelho tem seu próprio estoque de dados).
- Limpar o cache/dados do navegador apaga as ordens e o estoque salvos.
- Para ter os dados sempre disponíveis em qualquer aparelho, um passo futuro seria ligar o sistema a um banco de dados online — se precisar disso, é só pedir.

## Personalização

As cores e fontes seguem a identidade do ateliê (verde escuro, dourado e tons de linho) e ficam definidas no topo do arquivo `style.css`, em `:root`. Para trocar qualquer cor, basta editar os valores hexadecimais ali.
