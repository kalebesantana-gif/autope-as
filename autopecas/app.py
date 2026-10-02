"""
Rota 7 Autopeças - sistema web criado para a atividade "Desafio Hacker Ético".

####################################################################
#  ATENÇÃO - USO EDUCACIONAL                                       #
#  Este sistema contém vulnerabilidades inseridas DE PROPÓSITO      #
#  para uma atividade de sala de aula sobre segurança de            #
#  aplicações web. NÃO use este código como referência para um      #
#  sistema real e NÃO implante em produção / internet pública.      #
####################################################################
"""
import os
import sqlite3
from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, g, make_response
)

DB_PATH = os.path.join(os.path.dirname(__file__), "loja.db")

app = Flask(__name__)
app.secret_key = "rota7-chave-de-sessao-fixa-para-a-atividade"  # fixa de propósito


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ---------------------------------------------------------------- páginas

@app.route("/")
def home():
    db = get_db()
    produtos = db.execute("SELECT * FROM produtos ORDER BY categoria, nome").fetchall()
    return render_template("home.html", produtos=produtos)


@app.route("/produto/<int:produto_id>")
def produto(produto_id):
    db = get_db()
    produto = db.execute("SELECT * FROM produtos WHERE id = ?", (produto_id,)).fetchone()
    if not produto:
        flash("Produto não encontrado.", "erro")
        return redirect(url_for("home"))
    avaliacoes = db.execute(
        "SELECT * FROM avaliacoes WHERE produto_id = ? ORDER BY id DESC", (produto_id,)
    ).fetchall()
    return render_template("produto.html", produto=produto, avaliacoes=avaliacoes)


@app.route("/produto/<int:produto_id>/avaliar", methods=["POST"])
def avaliar(produto_id):
    if not session.get("usuario_id"):
        flash("Entre na sua conta para avaliar.", "erro")
        return redirect(url_for("login"))
    comentario = request.form.get("comentario", "")
    db = get_db()
    # VULNERABILIDADE: o comentário é salvo e depois renderizado com |safe,
    # sem nenhuma sanitização -> Cross-Site Scripting armazenado.
    db.execute(
        "INSERT INTO avaliacoes (produto_id, autor, comentario) VALUES (?, ?, ?)",
        (produto_id, session.get("usuario_nome"), comentario),
    )
    db.commit()
    flash("Avaliação publicada!", "ok")
    return redirect(url_for("produto", produto_id=produto_id))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario", "")
        senha = request.form.get("senha", "")
        db = get_db()

        # VULNERABILIDADE: SQL Injection.
        # A consulta é montada por concatenação de string, sem parâmetros
        # preparados, permitindo payloads como:  admin' --
        query = (
            "SELECT * FROM usuarios WHERE "
            f"(usuario = '{usuario}' OR email = '{usuario}') "
            f"AND senha = '{senha}'"
        )
        try:
            linha = db.execute(query).fetchone()
        except sqlite3.OperationalError:
            linha = None

        if linha:
            session["usuario_id"] = linha["id"]
            session["usuario_nome"] = linha["nome"]
            session["cargo"] = linha["cargo"]
            resp = make_response(redirect(url_for("home")))
            # VULNERABILIDADE: controle de papel (role) replicado em um
            # cookie legível e editável pelo cliente, usado depois para
            # decidir acesso à área administrativa.
            resp.set_cookie("role", linha["cargo"])
            flash(f"Bem-vindo(a), {linha['nome']}!", "ok")
            return resp
        else:
            flash("Usuário ou senha inválidos.", "erro")
    return render_template("login.html")


@app.route("/registro", methods=["GET", "POST"])
def registro():
    if request.method == "POST":
        db = get_db()
        nome = request.form.get("nome", "")
        usuario = request.form.get("usuario", "")
        email = request.form.get("email", "")
        senha = request.form.get("senha", "")
        existente = db.execute(
            "SELECT id FROM usuarios WHERE usuario = ?", (usuario,)
        ).fetchone()
        if existente:
            flash("Esse nome de usuário já existe.", "erro")
            return render_template("registro.html")
        db.execute(
            "INSERT INTO usuarios (nome, usuario, email, senha, cargo) "
            "VALUES (?, ?, ?, ?, 'cliente')",
            (nome, usuario, email, senha),
        )
        db.commit()
        flash("Conta criada! Faça login.", "ok")
        return redirect(url_for("login"))
    return render_template("registro.html")


@app.route("/logout")
def logout():
    session.clear()
    resp = make_response(redirect(url_for("home")))
    resp.delete_cookie("role")
    flash("Você saiu da sua conta.", "ok")
    return resp


@app.route("/perfil")
def perfil():
    if not session.get("usuario_id"):
        flash("Entre na sua conta primeiro.", "erro")
        return redirect(url_for("login"))
    db = get_db()
    usuario = db.execute(
        "SELECT * FROM usuarios WHERE id = ?", (session["usuario_id"],)
    ).fetchone()
    return render_template("perfil.html", usuario=usuario)


@app.route("/pedidos")
def pedidos():
    if not session.get("usuario_id"):
        flash("Entre na sua conta primeiro.", "erro")
        return redirect(url_for("login"))
    db = get_db()
    lista = db.execute(
        "SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC",
        (session["usuario_id"],),
    ).fetchall()
    return render_template("pedidos.html", pedidos=lista)


@app.route("/pedido/<int:pedido_id>")
def pedido(pedido_id):
    if not session.get("usuario_id"):
        flash("Entre na sua conta primeiro.", "erro")
        return redirect(url_for("login"))
    db = get_db()
    # VULNERABILIDADE: Insecure Direct Object Reference (IDOR).
    # A consulta não verifica se o pedido pertence ao usuário logado,
    # então basta trocar o número na URL para ver pedidos de terceiros.
    pedido = db.execute("SELECT * FROM pedidos WHERE id = ?", (pedido_id,)).fetchone()
    if not pedido:
        flash("Pedido não encontrado.", "erro")
        return redirect(url_for("pedidos"))
    return render_template("pedido.html", pedido=pedido)


@app.route("/admin")
def admin():
    # VULNERABILIDADE: controle de acesso quebrado.
    # A verificação usa apenas o cookie "role", que o próprio navegador
    # do usuário controla, em vez de validar o cargo armazenado no
    # servidor (sessão / banco de dados).
    if request.cookies.get("role") != "admin":
        flash("Acesso restrito a administradores.", "erro")
        return redirect(url_for("home"))

    cargo_real = None
    if session.get("usuario_id"):
        db = get_db()
        linha = db.execute(
            "SELECT cargo FROM usuarios WHERE id = ?", (session["usuario_id"],)
        ).fetchone()
        cargo_real = linha["cargo"] if linha else None
    sessao_adulterada = cargo_real != "admin"

    db = get_db()
    total_produtos = db.execute("SELECT COUNT(*) AS c FROM produtos").fetchone()["c"]
    total_usuarios = db.execute("SELECT COUNT(*) AS c FROM usuarios").fetchone()["c"]
    total_pedidos = db.execute("SELECT COUNT(*) AS c FROM pedidos").fetchone()["c"]
    return render_template(
        "admin.html",
        total_produtos=total_produtos,
        total_usuarios=total_usuarios,
        total_pedidos=total_pedidos,
        sessao_adulterada=sessao_adulterada,
    )


@app.route("/admin/usuarios")
def admin_usuarios():
    # Mesma checagem fraca baseada em cookie -> vulnerabilidade herdada aqui.
    if request.cookies.get("role") != "admin":
        flash("Acesso restrito a administradores.", "erro")
        return redirect(url_for("home"))
    db = get_db()
    # VULNERABILIDADE: exposição de informação sensível -- senhas em
    # texto puro e observações internas ficam visíveis nesta listagem.
    usuarios = db.execute("SELECT * FROM usuarios ORDER BY id").fetchall()
    return render_template("admin_usuarios.html", usuarios=usuarios)


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("Banco de dados não encontrado. Rode: python init_db.py")
    app.run(debug=True, host="127.0.0.1", port=5000)
