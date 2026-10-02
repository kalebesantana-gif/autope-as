# Rota 7 Autopeças

Sistema web de uma loja fictícia de autopeças, desenvolvido para a atividade
prática **"Desafio Hacker Ético"**.

> Projeto acadêmico. Não use este código como referência de boas práticas de
> segurança — ele foi construído, em parte, para ser testado.

## Funcionalidades

- Catálogo de produtos (peças automotivas)
- Cadastro e login de usuários
- Página de perfil
- Histórico e detalhes de pedidos
- Avaliações de produtos
- Área administrativa

## Como rodar localmente

Requer Python 3.10+.

```bash
# 1. clone o repositório
git clone <url-do-seu-repositorio>
cd autopecas

# 2. crie um ambiente virtual (opcional, recomendado)
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. instale as dependências
pip install -r requirements.txt

# 4. crie e popule o banco de dados
python init_db.py

# 5. rode o servidor
python app.py
```

O sistema fica disponível em `http://127.0.0.1:5000`.

## Usuários de teste

| usuário        | observação         |
|----------------|---------------------|
| joao_silva     | cliente             |
| maria_santos   | cliente             |
| admin          | administração       |

(as senhas seguem o padrão combinado em sala de aula)

## Estrutura do projeto

```
autopecas/
├── app.py              # rotas da aplicação
├── init_db.py          # criação/seed do banco de dados SQLite
├── requirements.txt
├── static/
│   └── style.css
└── templates/
    ├── base.html, home.html, produto.html, login.html, registro.html,
    │   perfil.html, pedidos.html, pedido.html, admin.html,
    │   admin_usuarios.html
```

## Aviso

Este sistema roda apenas localmente (`127.0.0.1`), sem hospedagem pública,
e faz parte de uma atividade controlada de sala de aula. Os testes de
segurança devem ser realizados exclusivamente pelos colegas autorizados
pelo professor, seguindo as regras da atividade.
