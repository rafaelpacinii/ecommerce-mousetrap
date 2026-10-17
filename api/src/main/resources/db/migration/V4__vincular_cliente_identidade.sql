ALTER TABLE cliente ADD COLUMN identidade_subject VARCHAR(255);
ALTER TABLE cliente ADD CONSTRAINT uk_cliente_identidade_subject UNIQUE (identidade_subject);
