/*
 * app.js — renderização das páginas.
 * Cada função aqui é chamada pela própria página (ver tag <script> no
 * final de cada .html) depois que o DOM carrega.
 */

function qs(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function formatoMoeda(valor) {
  return "R$ " + Number(valor).toFixed(2).replace(".", ",");
}

// ---------------------------------------------------------------- nav

function montarNav() {
  const sessao = getSessao();
  const role = getRole();
  const slot = document.getElementById("nav-slot");
  let html = '<a href="index.html">Catálogo</a>';

  if (sessao) {
    html += `<a href="pedidos.html">Meus pedidos</a>`;
    html += `<a href="perfil.html">Perfil</a>`;
    // VULNERABILIDADE (mesma falha do link admin): a exibição do link
    // confia na chave "role" solta no localStorage, não numa checagem
    // de servidor (porque aqui nem existe servidor).
    if (role === "admin") {
      html += `<a href="admin.html">Painel admin</a>`;
    }
    html += `<span class="pill">${escapeHtml(sessao.nome)}</span>`;
    html += `<a href="#" onclick="fazerLogout(); return false;">Sair</a>`;
  } else {
    html += `<a href="login.html">Entrar</a>`;
    html += `<a href="registro.html">Criar conta</a>`;
  }
  slot.innerHTML = html;
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ---------------------------------------------------------------- home

function renderizarCatalogo() {
  const db = getDB();
  const grid = document.getElementById("grid-produtos");
  grid.innerHTML = db.produtos
    .map(
      (p) => `
      <div class="card">
        <div class="emoji">${p.emoji}</div>
        <h2>${escapeHtml(p.nome)}</h2>
        <div class="categoria">${escapeHtml(p.categoria)}</div>
        <p>${escapeHtml(p.descricao)}</p>
        <div class="preco">${formatoMoeda(p.preco)}</div>
        <p style="margin:.5rem 0 1rem; color:var(--chalk-dim); font-size:.85rem;">${p.estoque} em estoque</p>
        <a class="btn" href="produto.html?id=${p.id}">Ver produto</a>
      </div>`
    )
    .join("");
}

// ---------------------------------------------------------------- produto

function renderizarProduto() {
  const id = Number(qs("id"));
  const db = getDB();
  const produto = db.produtos.find((p) => p.id === id);
  const container = document.getElementById("produto-detalhe");

  if (!produto) {
    container.innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  container.innerHTML = `
    <div class="emoji" style="font-size:2.4rem;">${produto.emoji}</div>
    <h1>${escapeHtml(produto.nome)}</h1>
    <div class="categoria">${escapeHtml(produto.categoria)}</div>
    <p>${escapeHtml(produto.descricao)}</p>
    <div class="preco">${formatoMoeda(produto.preco)}</div>
  `;

  renderizarAvaliacoes(id);

  const form = document.getElementById("form-avaliacao");
  const sessao = getSessao();
  if (sessao) {
    form.classList.remove("hidden");
    document.getElementById("aviso-login").classList.add("hidden");
    form.onsubmit = (e) => {
      e.preventDefault();
      const texto = document.getElementById("comentario").value;
      const db2 = getDB();
      db2.avaliacoes.push({
        id: db2._proximaAvaliacaoId++,
        produtoId: id,
        autor: sessao.nome,
        comentario: texto
      });
      saveDB(db2);
      document.getElementById("comentario").value = "";
      renderizarAvaliacoes(id);
    };
  } else {
    form.classList.add("hidden");
    document.getElementById("aviso-login").classList.remove("hidden");
  }
}

function renderizarAvaliacoes(produtoId) {
  const db = getDB();
  const lista = db.avaliacoes.filter((a) => a.produtoId === produtoId);
  const box = document.getElementById("lista-avaliacoes");
  if (lista.length === 0) {
    box.innerHTML = '<p style="color:var(--chalk-dim);">Ainda não há avaliações para este produto.</p>';
    return;
  }
  // VULNERABILIDADE: o comentário é inserido com innerHTML, sem nenhuma
  // sanitização -> Cross-Site Scripting armazenado (fica salvo no
  // localStorage e executa de novo toda vez que a página é aberta).
  box.innerHTML = lista
    .map(
      (a) => `<div class="review"><span class="autor">${escapeHtml(a.autor)}</span><span>${a.comentario}</span></div>`
    )
    .join("");
}

// ---------------------------------------------------------------- perfil

function renderizarPerfil() {
  exigirLogin();
  const sessao = getSessao();
  const db = getDB();
  const usuario = db.usuarios.find((u) => u.id === sessao.id);
  document.getElementById("perfil-tabela").innerHTML = `
    <tr><th>Nome</th><td>${escapeHtml(usuario.nome)}</td></tr>
    <tr><th>Usuário</th><td>${escapeHtml(usuario.usuario)}</td></tr>
    <tr><th>E-mail</th><td>${escapeHtml(usuario.email)}</td></tr>
    <tr><th>Telefone</th><td>${escapeHtml(usuario.telefone || "-")}</td></tr>
    <tr><th>Endereço</th><td>${escapeHtml(usuario.endereco || "-")}</td></tr>
    <tr><th>Cargo</th><td><span class="badge ${usuario.cargo === "admin" ? "admin" : ""}">${usuario.cargo}</span></td></tr>
  `;
}

// ---------------------------------------------------------------- pedidos

function renderizarPedidos() {
  exigirLogin();
  const sessao = getSessao();
  const db = getDB();
  const lista = db.pedidos.filter((p) => p.usuarioId === sessao.id);
  const box = document.getElementById("pedidos-tabela");

  if (lista.length === 0) {
    box.innerHTML = '<p style="color:var(--chalk-dim);">Você ainda não fez nenhum pedido.</p>';
    return;
  }

  box.innerHTML = `
    <table>
      <tr><th>Pedido</th><th>Itens</th><th>Total</th><th>Status</th><th></th></tr>
      ${lista
        .map(
          (p) => `<tr>
            <td>#${p.id}</td><td>${escapeHtml(p.itens)}</td><td>${formatoMoeda(p.total)}</td>
            <td>${p.status}</td><td><a href="pedido.html?id=${p.id}">ver detalhes</a></td>
          </tr>`
        )
        .join("")}
    </table>`;
}

function renderizarPedidoDetalhe() {
  exigirLogin();
  const id = Number(qs("id"));
  const db = getDB();
  // VULNERABILIDADE: Insecure Direct Object Reference (IDOR).
  // O pedido é buscado só pelo id da URL, sem checar se pertence ao
  // usuário logado -- basta trocar o número para ver pedidos de terceiros.
  const pedido = db.pedidos.find((p) => p.id === id);
  const box = document.getElementById("pedido-detalhe");

  if (!pedido) {
    box.innerHTML = "<p>Pedido não encontrado.</p>";
    return;
  }

  box.innerHTML = `
    <table>
      <tr><th>Itens</th><td>${escapeHtml(pedido.itens)}</td></tr>
      <tr><th>Total</th><td>${formatoMoeda(pedido.total)}</td></tr>
      <tr><th>Status</th><td>${pedido.status}</td></tr>
      ${pedido.notaInterna ? `<tr><th>Nota interna</th><td>${escapeHtml(pedido.notaInterna)}</td></tr>` : ""}
    </table>`;
}

// ---------------------------------------------------------------- admin

function renderizarAdmin() {
  // VULNERABILIDADE: controle de acesso quebrado. A checagem usa só a
  // chave "role" do localStorage, que o próprio visitante controla pelo
  // DevTools, em vez de validar o cargo de verdade salvo no usuário da
  // sessão.
  if (getRole() !== "admin") {
    window.location.href = "index.html";
    return;
  }

  const sessao = getSessao();
  const db = getDB();
  const usuarioReal = sessao ? db.usuarios.find((u) => u.id === sessao.id) : null;
  const sessaoAdulterada = !usuarioReal || usuarioReal.cargo !== "admin";

  document.getElementById("total-produtos").textContent = db.produtos.length;
  document.getElementById("total-usuarios").textContent = db.usuarios.length;
  document.getElementById("total-pedidos").textContent = db.pedidos.length;

  if (sessaoAdulterada) {
    document.getElementById("aviso-adulteracao").classList.remove("hidden");
  }
}

function renderizarAdminUsuarios() {
  if (getRole() !== "admin") {
    window.location.href = "index.html";
    return;
  }
  const db = getDB();
  // VULNERABILIDADE: exposição de dados sensíveis -- senhas em texto
  // puro e observações internas ficam visíveis nesta listagem.
  document.getElementById("usuarios-tabela").innerHTML = `
    <table>
      <tr><th>ID</th><th>Nome</th><th>Usuário</th><th>E-mail</th><th>Senha</th><th>Cargo</th><th>Observações internas</th></tr>
      ${db.usuarios
        .map(
          (u) => `<tr>
            <td>${u.id}</td><td>${escapeHtml(u.nome)}</td><td>${escapeHtml(u.usuario)}</td>
            <td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.senha)}</td>
            <td><span class="badge ${u.cargo === "admin" ? "admin" : ""}">${u.cargo}</span></td>
            <td>${escapeHtml(u.observacoesInternas || "-")}</td>
          </tr>`
        )
        .join("")}
    </table>`;
}
