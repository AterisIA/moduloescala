-- Adicionar coluna para descritores faciais numéricos
ALTER TABLE face_users 
ADD COLUMN IF NOT EXISTS descriptor FLOAT8[] DEFAULT NULL;

-- Adicionar índice para buscas de similaridade (preparando para pgvector no futuro)
CREATE INDEX IF NOT EXISTS idx_face_users_descriptor ON face_users (id) 
WHERE descriptor IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN face_users.descriptor IS 'Vetor de características faciais (embedding de 128 ou 512 dimensões) para comparação de similaridade';