-- Inserções iniciais para Marcas
INSERT INTO marca (nome, dataCadastro) VALUES ('Logitech', CURRENT_TIMESTAMP);
INSERT INTO marca (nome, dataCadastro) VALUES ('Razer', CURRENT_TIMESTAMP);
INSERT INTO marca (nome, dataCadastro) VALUES ('Zowie', CURRENT_TIMESTAMP);
INSERT INTO marca (nome, dataCadastro) VALUES ('VGN', CURRENT_TIMESTAMP);

-- Inserções iniciais para Mouses
INSERT INTO mouse (nome, preco, estoque, dpimaximo, pesogramas, tipoconexao, marca_id, dataCadastro)
VALUES ('G Pro X Superlight 2', 899.90, 15, 32000, 60, 2, 1, CURRENT_TIMESTAMP);

INSERT INTO mouse (nome, preco, estoque, dpimaximo, pesogramas, tipoconexao, marca_id, dataCadastro)
VALUES ('DeathAdder V3 Pro', 799.00, 10, 30000, 63, 2, 2, CURRENT_TIMESTAMP);