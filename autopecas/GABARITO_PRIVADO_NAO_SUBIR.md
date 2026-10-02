# Gabarito privado — NÃO subir para o GitHub

Este arquivo é só para você, para preencher o seu relatório de vulnerabilidades
e de correções (Etapas 2, 4 e 5 da atividade). Ele já está no `.gitignore`,
então `git add .` não vai incluí-lo — mas confira antes de dar `git push`.

Use isso como referência; escreva o relatório de verdade com suas próprias
palavras, capturas de tela e análise de impacto.

---

## 1. SQL Injection — bypass de login
- **Local:** rota `POST /login`, em `app.py`
- **Causa:** a consulta SQL é montada por f-string/concatenação, sem
  parâmetros preparados (`db.execute(query)` em vez de `db.execute(query, params)`).
- **Como explorar:** no campo "usuário", envie `admin') -- ` (com o espaço
  final) e qualquer senha. O comentário SQL (`--`) elimina o restante da
  cláusula `WHERE`, autenticando como o primeiro usuário cujo `usuario`
  seja `admin`, sem validar a senha.
- **Flag:** `FLAG{SQL_INJECTION_LOGIN_BYPASS}` (aparece nas observações
  internas do usuário admin, visíveis em `/admin/usuarios` após o bypass).
- **Impacto:** tomada de conta administrativa sem conhecer a senha;
  potencialmente extração de todo o banco de dados via técnicas de UNION-based
  ou blind SQLi.
- **Correção:** usar consultas parametrizadas (`?` + tupla de parâmetros no
  `sqlite3`), nunca concatenar entrada do usuário na string SQL. Também vale
  usar hashing de senha (ex. `werkzeug.security.generate_password_hash`).

## 2. IDOR (Insecure Direct Object Reference) — pedidos de outros usuários
- **Local:** rota `GET /pedido/<id>`, em `app.py`
- **Causa:** a consulta busca o pedido só pelo `id` da URL, sem checar se
  `pedido.usuario_id == session['usuario_id']`.
- **Como explorar:** logado como qualquer cliente, acesse `/pedido/1`,
  `/pedido/2`, `/pedido/3` etc. e veja pedidos que não são seus.
- **Flag:** `FLAG{IDOR_PEDIDO_TERCEIRO}` (nota interna do pedido #3, que
  pertence à usuária maria_santos).
- **Impacto:** exposição de dados pessoais e de pedidos de outros clientes
  (endereço, itens comprados, CPF na nota interna).
- **Correção:** validar no servidor que o `usuario_id` do pedido bate com o
  usuário da sessão antes de retornar os dados (ex.:
  `WHERE id = ? AND usuario_id = ?`), devolvendo 403/404 caso contrário.

## 3. Controle de acesso quebrado + sessão baseada em cookie adulterável
- **Local:** rotas `GET /admin` e `GET /admin/usuarios`, em `app.py`
- **Causa:** a verificação de administrador usa só
  `request.cookies.get("role") == "admin"`. Esse cookie é definido em texto
  puro no login e pode ser editado livremente pelo navegador (DevTools >
  Application > Cookies), sem nenhuma validação contra o cargo real
  armazenado no banco/sessão do servidor.
- **Como explorar:** faça login com qualquer conta de cliente (ou nem faça
  login), edite o cookie `role` para `admin` nas ferramentas do navegador, e
  acesse `/admin` diretamente pela URL.
- **Flags:**
  - `FLAG{CONTROLE_ACESSO_QUEBRADO}` — aparece ao simplesmente acessar
    `/admin` sem ser administrador de verdade.
  - `FLAG{COOKIE_ROLE_ADULTERADO}` — aparece quando o cargo real da sessão
    não é "admin" mas o cookie diz que é (evidência direta de adulteração).
- **Impacto:** qualquer visitante vira "administrador" só editando um cookie;
  acesso à lista de usuários, senhas em texto puro e dados internos.
- **Correção:** nunca confiar em dado vindo do cliente para decisões de
  autorização. Checar o cargo a partir da sessão do servidor (ou de um token
  assinado/validado no backend) a cada requisição sensível.

## 4. Cross-Site Scripting (XSS) armazenado — avaliações de produto
- **Local:** rota `POST /produto/<id>/avaliar` (gravação) e template
  `templates/produto.html` (renderização com `|safe`)
- **Causa:** o comentário do usuário é salvo sem sanitização e renderizado
  com o filtro Jinja `|safe`, que desativa o escape automático de HTML.
- **Como explorar:** logado, publique uma avaliação com
  `<script>alert(document.cookie)</script>` (ou qualquer payload de prova de
  conceito) e veja o script executar para qualquer visitante da página do
  produto.
- **Impacto:** roubo de cookies/sessão de outros usuários (inclusive o
  cookie `role`), redirecionamento malicioso, phishing dentro do próprio site.
- **Correção:** nunca usar `|safe` em conteúdo gerado por usuário; deixar o
  escape automático do Jinja ativo, ou sanitizar explicitamente com uma
  biblioteca como `bleach` caso HTML limitado seja realmente necessário.

## 5. Exposição de dados sensíveis — backup acessível publicamente
- **Local:** `static/db_backup_old.sql`, referenciado em comentário HTML no
  `templates/base.html`
- **Causa:** um arquivo de backup com dados de usuários (incluindo senhas em
  texto puro) foi deixado dentro da pasta `static/`, que o Flask serve
  publicamente por padrão, sem nenhuma autenticação.
- **Como explorar:** ver o código-fonte da página inicial (há uma pista em
  comentário HTML) ou simplesmente acessar
  `/static/db_backup_old.sql` diretamente.
- **Flag:** `FLAG{DADOS_SENSIVEIS_EXPOSTOS}`
- **Impacto:** vazamento de credenciais e dados pessoais de todos os
  usuários cadastrados.
- **Correção:** nunca guardar backups, dumps ou arquivos de configuração
  dentro de uma pasta servida publicamente; usar armazenamento privado com
  controle de acesso, e nunca versionar segredos/backups no Git.

---

## Observação sobre senhas em texto puro (bônus)
Além das vulnerabilidades acima, o sistema também guarda senhas sem hash
(`senha` em texto puro na tabela `usuarios`). Vale mencionar isso na sua
reflexão/relatório como boa prática ausente, mesmo sem ter uma flag própria —
está ligado diretamente à vulnerabilidade de SQL Injection e à de exposição
de dados.
