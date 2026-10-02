# Gabarito privado — NÃO subir para o GitHub

Isso é só pra você, pra preencher o relatório de vulnerabilidades e de
correções (Etapas 2, 4 e 5 da atividade). Já está no `.gitignore`, mas
confira antes do `git push` pra não entregar as respostas de bandeja.

Nota importante sobre esta versão: como é um site **estático** (sem
servidor/banco real), o "banco de dados" é simulado no `localStorage` do
navegador e é **individual de cada pessoa** — não existe um servidor
central que todos compartilham. Isso significa duas coisas:
1. A vulnerabilidade de "SQL Injection" foi recriada como uma injeção de
   **expressão JavaScript** no login (o mesmo princípio — entrada do
   usuário virando código/consulta em vez de permanecer só dado — só que
   do lado do cliente). Vale explicar essa adaptação na sua reflexão.
2. O XSS armazenado funciona e persiste (recarregando a página o script
   continua lá), mas só "ataca" quem estiver usando aquele mesmo
   navegador/aba — num app real com backend, o mesmo payload afetaria
   qualquer visitante. Isso também vale a pena comentar no relatório.

---

## 1. Injeção na consulta de login (simula SQL Injection)
- **Local:** `js/auth.js`, função `tentarLogin()`
- **Causa:** a função monta uma expressão JavaScript concatenando os
  valores digitados nos campos de usuário/senha e avalia essa expressão
  com `new Function(...)` — equivalente a montar uma query SQL por
  concatenação de string.
- **Payload que funciona:** no campo "usuário", digite
  `x') || (u.cargo==='admin'))//` (qualquer coisa no campo senha). Isso
  injeta uma condição que vira verdadeira só para o registro cujo
  `cargo` é `admin`, então o login é aceito sem saber a senha.
- **Flag:** `FLAG{INJECAO_LOGIN_BYPASS}` (nas observações internas do
  usuário admin, visíveis em `admin-usuarios.html` depois do bypass).
- **Impacto:** login como administrador sem conhecer a senha.
- **Correção:** nunca construir "consultas" (SQL ou, como aqui, lógica de
  comparação) concatenando entrada do usuário. Comparar os campos
  diretamente (`u.usuario === usuarioDigitado && u.senha === senhaDigitada`),
  sem `eval`/`new Function` envolvendo dado do usuário. Num backend real,
  isso significa sempre usar consultas parametrizadas.

## 2. IDOR — pedidos de outros usuários
- **Local:** `js/app.js`, função `renderizarPedidoDetalhe()` / página
  `pedido.html?id=`
- **Causa:** o pedido é buscado só pelo `id` da URL, sem checar se
  pertence ao usuário logado.
- **Como explorar:** logado como qualquer cliente, troque o número em
  `pedido.html?id=1`, `?id=2`, `?id=3` etc.
- **Flag:** `FLAG{IDOR_PEDIDO_TERCEIRO}` (nota interna do pedido #3,
  que pertence à maria_santos).
- **Impacto:** exposição de dados de pedidos de outros clientes.
- **Correção:** validar no "backend" (aqui, na própria função JS) que o
  `usuarioId` do pedido bate com o usuário da sessão antes de exibir.

## 3. Controle de acesso quebrado + "sessão" adulterável
- **Local:** `js/app.js` (`renderizarAdmin`, `renderizarAdminUsuarios`,
  `montarNav`), `js/db.js` (`ROLE_KEY`)
- **Causa:** o acesso ao painel admin depende só da chave
  `rota7_role` no `localStorage`, que qualquer um pode editar pelo
  console do navegador (F12 → Application/Armazenamento → Local
  Storage), sem validar contra o cargo real salvo na sessão.
- **Como explorar:** abra o console (F12) em qualquer página e rode:
  ```js
  localStorage.setItem('rota7_role', 'admin')
  ```
  depois acesse `admin.html` diretamente pela URL.
- **Flags:**
  - `FLAG{CONTROLE_ACESSO_QUEBRADO}` — aparece ao acessar `admin.html`
    sem ser administrador de verdade.
  - `FLAG{SESSAO_ROLE_ADULTERADA}` — aparece quando o cargo real do
    usuário logado não é admin, mas a chave `rota7_role` diz que é
    (prova direta de adulteração). Se ninguém estiver logado, dá pra
    ver essa mesma falha rodando o comando acima sem nem ter feito
    login.
- **Impacto:** qualquer visitante vira "administrador" só editando uma
  chave de armazenamento local; acesso à lista de usuários e senhas em
  texto puro.
- **Correção:** nunca confiar em dado controlado pelo cliente para
  decisões de autorização; validar sempre a partir da sessão real.

## 4. XSS armazenado — avaliações de produto
- **Local:** `js/app.js`, função `renderizarAvaliacoes()`
- **Causa:** o comentário da avaliação é inserido com `innerHTML` sem
  nenhum escape, então HTML/JavaScript dentro do comentário é executado.
- **Como explorar:** logado, na página de um produto, publique uma
  avaliação com `<img src=x onerror="alert(document.cookie)">` (ou
  `<script>alert(1)</script>`, dependendo do navegador) e veja o script
  rodar ao recarregar a página.
- **Impacto:** em uma aplicação real com backend, esse tipo de falha
  afeta qualquer visitante da página (roubo de sessão, phishing,
  desfiguração). Nesta versão estática, o efeito fica restrito ao
  navegador de quem publicou o comentário, já que não há um servidor
  compartilhando os dados entre pessoas diferentes — mas o problema de
  fundo (ausência de sanitização) é o mesmo.
- **Correção:** nunca usar `innerHTML` com conteúdo vindo do usuário sem
  sanitizar; usar `textContent` para texto puro, ou uma função de
  escape (como a `escapeHtml()` já usada em outros pontos do próprio
  `app.js`) antes de inserir o comentário na página.

## 5. Exposição de dados sensíveis — backup acessível publicamente
- **Local:** `data/backup-old.json`, referenciado em comentário HTML no
  `<head>` do `index.html`
- **Causa:** um arquivo de backup com dados de usuários (incluindo
  senhas em texto puro) foi deixado dentro de uma pasta pública do site.
- **Como explorar:** ver o código-fonte da página inicial (Ctrl+U) — há
  uma pista em comentário HTML — ou acessar diretamente
  `data/backup-old.json`.
- **Flag:** `FLAG{DADOS_SENSIVEIS_EXPOSTOS}`
- **Impacto:** vazamento de credenciais e dados pessoais.
- **Correção:** nunca publicar backups, dumps ou arquivos de
  configuração dentro de pastas servidas publicamente pelo site.

---

## Observação sobre senhas em texto puro (bônus)
As senhas ficam salvas sem nenhum hash no "banco" (`js/db.js`). Vale
mencionar isso na reflexão como boa prática ausente, mesmo sem flag
própria — está diretamente ligado à injeção de login e à exposição de
dados.
