-- Verificar a estrutura atual da tabela escala
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'escala' AND table_schema = 'public';

-- Corrigir a sequência e o auto-increment
-- Primeiro, vamos garantir que a sequência existe e está configurada corretamente
CREATE SEQUENCE IF NOT EXISTS escala_idescala_seq;

-- Definir o próximo valor da sequência baseado no maior ID existente
SELECT setval('escala_idescala_seq', (SELECT COALESCE(MAX(idescala), 0) + 1 FROM escala), false);

-- Garantir que a coluna idescala usa a sequência como padrão
ALTER TABLE escala ALTER COLUMN idescala SET DEFAULT nextval('escala_idescala_seq');

-- Garantir que a sequência pertence à coluna
ALTER SEQUENCE escala_idescala_seq OWNED BY escala.idescala;