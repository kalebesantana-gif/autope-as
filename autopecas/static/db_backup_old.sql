-- Backup antigo gerado automaticamente - NAO COMMITAR EM PRODUCAO
-- rota7_autopecas - dump parcial (usuarios)
-- Gerado em: 2026-03-14 02:00:11

INSERT INTO usuarios (nome, usuario, email, senha, cargo) VALUES
('João Silva', 'joao_silva', 'joao.silva@rota7.com.br', 'fusca1977', 'cliente'),
('Maria Santos', 'maria_santos', 'maria.santos@rota7.com.br', 'corsa2010', 'cliente'),
('Admin Rota7', 'admin', 'admin@rota7.com.br', 'R0ta7_Adm!n2024', 'admin');

-- TODO: mover backups para storage privado, nao deixar na pasta static/
-- TODO: revisar permissao de acesso deste arquivo
-- FLAG{DADOS_SENSIVEIS_EXPOSTOS}
