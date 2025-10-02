-- Tabela de cadastros faciais (apenas embeddings, sem imagem)
CREATE TABLE IF NOT EXISTS public.face_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT,
  embedding DOUBLE PRECISION[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_face_users_created_at ON public.face_users(created_at DESC);

-- Tabela de logs de reconhecimento facial (auditoria, sem mídia)
CREATE TABLE IF NOT EXISTS public.face_recognition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  face_user_id UUID REFERENCES public.face_users(id) ON DELETE SET NULL,
  confidence DOUBLE PRECISION,
  matched BOOLEAN NOT NULL DEFAULT false,
  kiosk_id UUID REFERENCES public.kiosks(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ DEFAULT now(),
  note TEXT
);

-- Índice para auditoria
CREATE INDEX IF NOT EXISTS idx_face_recognition_logs_captured_at ON public.face_recognition_logs(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_recognition_logs_face_user_id ON public.face_recognition_logs(face_user_id);

-- Adicionar colunas de reconhecimento facial em attendance_logs
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS face_user_id UUID REFERENCES public.face_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS face_confidence DOUBLE PRECISION;

-- Tornar selfie_path opcional (antes era NOT NULL)
ALTER TABLE public.attendance_logs
  ALTER COLUMN selfie_path DROP NOT NULL;

-- RLS para face_users (DEMO mode - todos podem ler/escrever)
ALTER TABLE public.face_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DEMO: Todos podem visualizar cadastros faciais"
  ON public.face_users FOR SELECT
  USING (true);

CREATE POLICY "DEMO: Todos podem inserir cadastros faciais"
  ON public.face_users FOR INSERT
  WITH CHECK (true);

-- RLS para face_recognition_logs (DEMO mode)
ALTER TABLE public.face_recognition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DEMO: Todos podem visualizar logs de reconhecimento"
  ON public.face_recognition_logs FOR SELECT
  USING (true);

CREATE POLICY "DEMO: Todos podem inserir logs de reconhecimento"
  ON public.face_recognition_logs FOR INSERT
  WITH CHECK (true);