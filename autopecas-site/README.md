# Rota 7 Autopeças

Sistema web de uma loja fictícia de autopeças, desenvolvido para a atividade
prática **"Desafio Hacker Ético"**.

> Projeto acadêmico. Não use este código como referência de boas práticas de
> segurança — ele foi construído, em parte, para ser testado.

Este é um site **100% estático** (HTML + CSS + JavaScript, sem backend),
para poder ser hospedado de graça direto pelo GitHub Pages, sem precisar
instalar nada. Os "dados" (usuários, pedidos, avaliações) ficam guardados no
`localStorage` do próprio navegador.

## Como abrir

**Opção 1 — GitHub Pages (recomendado, é só um link):**
1. Suba esta pasta para um repositório no GitHub.
2. Vá em **Settings → Pages**, escolha a branch principal e salve.
3. Em alguns minutos o site fica no ar em
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
4. Passe esse link para o colega que for testar.

**Opção 2 — testar na sua máquina, sem instalar nada além do navegador:**
Abra o arquivo `index.html` direto no navegador (duplo clique). A navegação e
o catálogo funcionam assim. Se notar que o login não salva a sessão,
alguns navegadores restringem `localStorage` para páginas abertas via
`file://`; nesse caso, sirva a pasta com um servidor simples (não precisa de
Python/Flask, qualquer um serve), por exemplo com a extensão **"Live
Server"** do VS Code, ou rodando `npx serve` na pasta.

## Usuários de teste

| usuário        | observação         |
|----------------|---------------------|
| joao_silva     | cliente             |
| maria_santos   | cliente             |
| admin          | administração       |

(as senhas seguem o padrão combinado em sala de aula)

Para reiniciar os dados do zero (apagar tudo que foi salvo no navegador),
abra o console do navegador (F12) em qualquer página do site e rode:
```js
resetDB()
```

## Estrutura do projeto

```
autopecas-site/
├── index.html, produto.html, login.html, registro.html,
│   perfil.html, pedidos.html, pedido.html,
│   admin.html, admin-usuarios.html
├── css/style.css
├── js/
│   ├── db.js     # "banco de dados" (localStorage) + sessão
│   ├── auth.js   # login / cadastro / logout
│   └── app.js    # renderização de cada página
└── data/backup-old.json
```

## Aviso

Este sistema faz parte de uma atividade controlada de sala de aula. Os
testes de segurança devem ser realizados exclusivamente pelos colegas
autorizados pelo professor, seguindo as regras da atividade.
