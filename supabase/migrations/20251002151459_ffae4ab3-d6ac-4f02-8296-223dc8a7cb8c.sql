-- Criar tabela de kiosques
CREATE TABLE IF NOT EXISTS public.kiosks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  local text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  segredo_base32 text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de logs de batidas
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kiosk_id uuid NOT NULL REFERENCES public.kiosks(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('ENTRADA', 'SAÍDA')),
  punched_at timestamp with time zone NOT NULL DEFAULT now(),
  selfie_path text NOT NULL,
  device_info jsonb,
  token_window text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_kiosk_id ON public.attendance_logs(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_punched_at ON public.attendance_logs(punched_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_token_window ON public.attendance_logs(token_window);

-- Habilitar RLS (modo DEMO permite tudo)
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Policies DEMO (permitem tudo para anon/authenticated)
CREATE POLICY "DEMO: Todos podem visualizar kiosques" 
ON public.kiosks FOR SELECT USING (true);

CREATE POLICY "DEMO: Todos podem inserir kiosques" 
ON public.kiosks FOR INSERT WITH CHECK (true);

CREATE POLICY "DEMO: Todos podem atualizar kiosques" 
ON public.kiosks FOR UPDATE USING (true);

CREATE POLICY "DEMO: Todos podem deletar kiosques" 
ON public.kiosks FOR DELETE USING (true);

CREATE POLICY "DEMO: Todos podem visualizar attendance_logs" 
ON public.attendance_logs FOR SELECT USING (true);

CREATE POLICY "DEMO: Todos podem inserir attendance_logs" 
ON public.attendance_logs FOR INSERT WITH CHECK (true);

-- Trigger para updated_at em kiosks
CREATE TRIGGER update_kiosks_updated_at
BEFORE UPDATE ON public.kiosks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para vídeos de selfie
INSERT INTO storage.buckets (id, name, public)
VALUES ('attendance-selfies', 'attendance-selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage DEMO (permitir select e insert para anon)
CREATE POLICY "DEMO: Anyone can view selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-selfies');

CREATE POLICY "DEMO: Anyone can upload selfies"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-selfies');