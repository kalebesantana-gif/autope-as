/*
 * auth.js — login, cadastro e logout.
 *
 * VULNERABILIDADE PRINCIPAL (simula SQL Injection):
 * Como não existe banco de dados real nesta versão estática, a
 * "consulta" de login é montada concatenando o que o usuário digitou
 * dentro de uma expressão JavaScript, que depois é avaliada com
 * `new Function(...)`. Isso é exatamente o mesmo tipo de erro que causa
 * SQL Injection num backend real (dado do usuário virando código/consulta
 * em vez de permanecer só "dado"), só que aqui o "código" é JS. Ver
 * GABARITO_PRIVADO_NAO_SUBIR.md para o payload que quebra o login.
 */

function tentarLogin(usuarioDigitado, senhaDigitada) {
  const db = getDB();
  for (const u of db.usuarios) {
    const expressao =
      "((u.usuario === '" + usuarioDigitado + "') && (u.senha === '" + senhaDigitada + "'))";
    try {
      const bateu = new Function("u", "return " + expressao + ";")(u);
      if (bateu) return u;
    } catch (e) {
      // payload de injeção quebrou a expressão para este usuário específico;
      // seguimos tentando os próximos registros
    }
  }
  return null;
}

function aoSubmeterLogin(event) {
  event.preventDefault();
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const encontrado = tentarLogin(usuario, senha);
  const flash = document.getElementById("flash");

  if (encontrado) {
    setSessao(encontrado);
    window.location.href = "index.html";
  } else {
    flash.textContent = "Usuário ou senha inválidos.";
    flash.className = "flash erro";
    flash.classList.remove("hidden");
  }
}

function aoSubmeterRegistro(event) {
  event.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const usuario = document.getElementById("usuario").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const flash = document.getElementById("flash");

  const db = getDB();
  if (db.usuarios.some((u) => u.usuario === usuario)) {
    flash.textContent = "Esse nome de usuário já existe.";
    flash.className = "flash erro";
    flash.classList.remove("hidden");
    return;
  }

  const novo = {
    id: db._proximoUsuarioId++,
    nome, usuario, email, senha,
    cargo: "cliente",
    telefone: "", endereco: "",
    observacoesInternas: null
  };
  db.usuarios.push(novo);
  saveDB(db);
  window.location.href = "login.html";
}

function fazerLogout() {
  logout();
  window.location.href = "index.html";
}
