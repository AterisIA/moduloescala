-- Criar bucket para imagens faciais (público para visualização)
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-images', 'face-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para face-images bucket
CREATE POLICY "Todos podem visualizar imagens faciais"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'face-images');

CREATE POLICY "DEMO: Todos podem fazer upload de imagens faciais"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'face-images');

CREATE POLICY "DEMO: Todos podem deletar imagens faciais"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'face-images');

-- Atualizar tabela face_users para armazenar paths das imagens
ALTER TABLE public.face_users
  DROP COLUMN IF EXISTS embedding,
  ADD COLUMN IF NOT EXISTS image_paths TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS facial_features JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

COMMENT ON COLUMN public.face_users.image_paths IS 'Paths das 3 imagens de cadastro no bucket face-images';
COMMENT ON COLUMN public.face_users.facial_features IS 'Características faciais extraídas pela IA';
COMMENT ON COLUMN public.face_users.description IS 'Descrição textual das características faciais';

-- Atualizar face_recognition_logs
ALTER TABLE public.face_recognition_logs
  DROP COLUMN IF EXISTS confidence,
  ADD COLUMN IF NOT EXISTS similarity_score DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_image_path TEXT DEFAULT NULL;

COMMENT ON COLUMN public.face_recognition_logs.similarity_score IS 'Score de similaridade calculado pela IA (0-1)';
COMMENT ON COLUMN public.face_recognition_logs.verification_image_path IS 'Path da imagem usada na verificação';