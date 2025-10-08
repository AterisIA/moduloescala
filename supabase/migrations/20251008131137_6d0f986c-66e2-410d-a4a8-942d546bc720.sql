-- Adicionar coluna pausa_minutos na tabela escala
ALTER TABLE public.escala 
ADD COLUMN pausa_minutos integer DEFAULT NULL;

COMMENT ON COLUMN public.escala.pausa_minutos IS 'Duração da pausa em minutos (72 para 1h12min ou 60 para 1h)';