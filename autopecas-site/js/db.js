/*
 * db.js — "banco de dados" da Rota 7 Autopeças.
 *
 * ATENÇÃO - USO EDUCACIONAL
 * Este site é 100% estático (HTML + CSS + JS), feito para a atividade
 * "Desafio Hacker Ético". Como não existe servidor nem banco de dados de
 * verdade, os dados ficam salvos no localStorage do navegador, e
 * algumas falhas que normalmente seriam de backend (ex.: injeção em
 * consulta SQL) foram recriadas no lado do cliente para continuar
 * praticável sem precisar hospedar nada. Veja o GABARITO para detalhes.
 */

const DB_KEY = "rota7_db";
const SESSION_KEY = "rota7_sessao";
const ROLE_KEY = "rota7_role"; // valor separado e adulterável -- vulnerabilidade proposital

const SEED = {
  usuarios: [
    {
      id: 1, nome: "João Silva", usuario: "joao_silva",
      email: "joao.silva@rota7.com.br", senha: "fusca1977", cargo: "cliente",
      telefone: "(61) 99812-3344", endereco: "Quadra 12, Taguatinga - DF",
      observacoesInternas: null
    },
    {
      id: 2, nome: "Maria Santos", usuario: "maria_santos",
      email: "maria.santos@rota7.com.br", senha: "corsa2010", cargo: "cliente",
      telefone: "(61) 99221-7788", endereco: "Asa Sul, Brasília - DF",
      observacoesInternas: null
    },
    {
      id: 3, nome: "Admin Rota7", usuario: "admin",
      email: "admin@rota7.com.br", senha: "R0ta7_Adm!n2024", cargo: "admin",
      telefone: "(61) 3344-5566", endereco: "Depósito Central, SIA - DF",
      observacoesInternas: "Lembrete: trocar a senha padrao do painel. FLAG{INJECAO_LOGIN_BYPASS}"
    }
  ],
  produtos: [
    { id: 1, nome: "Pastilha de Freio Dianteira", categoria: "Freios", preco: 89.90, estoque: 42, emoji: "🛑", descricao: "Pastilha cerâmica de alta performance para veículos de passeio." },
    { id: 2, nome: "Óleo de Motor 5W30 Sintético (1L)", categoria: "Lubrificantes", preco: 54.50, estoque: 120, emoji: "🛢️", descricao: "Óleo 100% sintético, troca recomendada a cada 10.000km." },
    { id: 3, nome: "Bateria Automotiva 60Ah", categoria: "Elétrica", preco: 349.00, estoque: 15, emoji: "🔋", descricao: "Bateria selada, livre de manutenção, 18 meses de garantia." },
    { id: 4, nome: "Pneu Aro 15 185/65", categoria: "Pneus", preco: 410.00, estoque: 28, emoji: "🛞", descricao: "Pneu para uso urbano e rodoviário, índice de carga 88H." },
    { id: 5, nome: "Vela de Ignição Iridium", categoria: "Ignição", preco: 39.90, estoque: 80, emoji: "⚡", descricao: "Maior durabilidade e melhor combustão." },
    { id: 6, nome: "Filtro de Ar Esportivo", categoria: "Filtros", preco: 119.00, estoque: 33, emoji: "🌬️", descricao: "Aumenta o fluxo de ar e a resposta do motor." },
    { id: 7, nome: "Amortecedor Traseiro", categoria: "Suspensão", preco: 275.00, estoque: 19, emoji: "🔧", descricao: "Amortecedor a gás, par dianteiro ou traseiro." },
    { id: 8, nome: "Correia Dentada Kit Completo", categoria: "Motor", preco: 189.90, estoque: 24, emoji: "⚙️", descricao: "Kit com correia, tensor e polia, recomendado a cada 60.000km." }
  ],
  avaliacoes: [
    { id: 1, produtoId: 1, autor: "joao_silva", comentario: "Instalei fácil, freou muito bem. Recomendo!" },
    { id: 2, produtoId: 2, autor: "maria_santos", comentario: "Óleo bom, troquei e o carro ficou mais suave." },
    { id: 3, produtoId: 3, autor: "joao_silva", comentario: "Bateria aguentando tranquilo mesmo no frio." }
  ],
  pedidos: [
    { id: 1, usuarioId: 1, itens: "2x Pastilha de Freio Dianteira, 1x Óleo de Motor 5W30", total: 234.30, status: "Entregue", notaInterna: null },
    { id: 2, usuarioId: 1, itens: "1x Bateria Automotiva 60Ah", total: 349.00, status: "Em separação", notaInterna: null },
    { id: 3, usuarioId: 2, itens: "4x Pneu Aro 15 185/65", total: 1640.00, status: "Entregue",
      notaInterna: "Cliente pediu nota fiscal com CPF completo: 123.456.789-00. FLAG{IDOR_PEDIDO_TERCEIRO}" }
  ],
  _proximoUsuarioId: 4,
  _proximaAvaliacaoId: 4
};

function initDB() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED));
  }
}

function getDB() {
  initDB();
  return JSON.parse(localStorage.getItem(DB_KEY));
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function resetDB() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROLE_KEY);
  initDB();
}

// ---------------------------------------------------------------- sessão

function getSessao() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setSessao(usuario) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: usuario.id, nome: usuario.nome, cargo: usuario.cargo
  }));
  // VULNERABILIDADE: o "papel" do usuário também é salvo numa chave
  // separada e totalmente editável pelo navegador (equivalente a um
  // cookie de role em texto puro). O painel admin confia nessa chave.
  localStorage.setItem(ROLE_KEY, usuario.cargo);
}

function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROLE_KEY);
}

function exigirLogin() {
  if (!getSessao()) {
    window.location.href = "login.html";
  }
}

initDB();
