"""
init_db.py
Cria e popula o banco de dados SQLite da loja "Rota 7 Autopeças".

ATENÇÃO: este script existe propositalmente para uma atividade de ensino
sobre segurança de aplicações web. As senhas são salvas em texto puro e
alguns dados contêm informações sensíveis de propósito. Não reutilize
este padrão em sistemas reais.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "loja.db")

SCHEMA = """
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS avaliacoes;
DROP TABLE IF EXISTS pedidos;

CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    senha TEXT NOT NULL,
    cargo TEXT NOT NULL DEFAULT 'cliente',
    telefone TEXT,
    endereco TEXT,
    observacoes_internas TEXT
);

CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    preco REAL NOT NULL,
    estoque INTEGER NOT NULL,
    descricao TEXT,
    imagem_emoji TEXT
);

CREATE TABLE avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    autor TEXT NOT NULL,
    comentario TEXT NOT NULL
);

CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    itens TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    nota_interna TEXT
);
"""

def seed():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript(SCHEMA)

    # Usuários (senhas em texto puro -- vulnerabilidade proposital)
    usuarios = [
        ("João Silva", "joao_silva", "joao.silva@rota7.com.br", "fusca1977", "cliente",
         "(61) 99812-3344", "Quadra 12, Taguatinga - DF", None),
        ("Maria Santos", "maria_santos", "maria.santos@rota7.com.br", "corsa2010", "cliente",
         "(61) 99221-7788", "Asa Sul, Brasília - DF", None),
        ("Admin Rota7", "admin", "admin@rota7.com.br", "R0ta7_Adm!n2024", "admin",
         "(61) 3344-5566", "Depósito Central, SIA - DF",
         "Lembrete: trocar a senha padrao do painel. FLAG{SQL_INJECTION_LOGIN_BYPASS}"),
    ]
    cur.executemany(
        "INSERT INTO usuarios (nome, usuario, email, senha, cargo, telefone, endereco, observacoes_internas) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        usuarios,
    )

    produtos = [
        ("Pastilha de Freio Dianteira", "Freios", 89.90, 42,
         "Pastilha cerâmica de alta performance para veículos de passeio.", "🛑"),
        ("Óleo de Motor 5W30 Sintético (1L)", "Lubrificantes", 54.50, 120,
         "Óleo 100% sintético, troca recomendada a cada 10.000km.", "🛢️"),
        ("Bateria Automotiva 60Ah", "Elétrica", 349.00, 15,
         "Bateria selada, livre de manutenção, 18 meses de garantia.", "🔋"),
        ("Pneu Aro 15 185/65", "Pneus", 410.00, 28,
         "Pneu para uso urbano e rodoviário, índice de carga 88H.", "🛞"),
        ("Vela de Ignição Iridium", "Ignição", 39.90, 80,
         "Maior durabilidade e melhor combustão.", "⚡"),
        ("Filtro de Ar Esportivo", "Filtros", 119.00, 33,
         "Aumenta o fluxo de ar e a resposta do motor.", "🌬️"),
        ("Amortecedor Traseiro", "Suspensão", 275.00, 19,
         "Amortecedor a gás, par dianteiro ou traseiro.", "🔧"),
        ("Correia Dentada Kit Completo", "Motor", 189.90, 24,
         "Kit com correia, tensor e polia, recomendado a cada 60.000km.", "⚙️"),
    ]
    cur.executemany(
        "INSERT INTO produtos (nome, categoria, preco, estoque, descricao, imagem_emoji) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        produtos,
    )

    avaliacoes = [
        (1, "joao_silva", "Instalei fácil, freou muito bem. Recomendo!"),
        (2, "maria_santos", "Óleo bom, troquei e o carro ficou mais suave."),
        (3, "joao_silva", "Bateria aguentando tranquilo mesmo no frio."),
    ]
    cur.executemany(
        "INSERT INTO avaliacoes (produto_id, autor, comentario) VALUES (?, ?, ?)",
        avaliacoes,
    )

    pedidos = [
        (1, "2x Pastilha de Freio Dianteira, 1x Óleo de Motor 5W30", 234.30, "Entregue", None),
        (1, "1x Bateria Automotiva 60Ah", 349.00, "Em separação", None),
        (2, "4x Pneu Aro 15 185/65", 1640.00, "Entregue",
         "Cliente pediu nota fiscal com CPF completo: 123.456.789-00. "
         "FLAG{IDOR_PEDIDO_TERCEIRO}"),
    ]
    cur.executemany(
        "INSERT INTO pedidos (usuario_id, itens, total, status, nota_interna) "
        "VALUES (?, ?, ?, ?, ?)",
        pedidos,
    )

    con.commit()
    con.close()
    print(f"Banco de dados criado em: {DB_PATH}")

if __name__ == "__main__":
    seed()
