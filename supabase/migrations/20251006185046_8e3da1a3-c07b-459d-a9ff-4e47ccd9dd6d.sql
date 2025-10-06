-- Substituir campo único por arrays para múltiplos dias
ALTER TABLE public.escala
DROP COLUMN IF EXISTS folga_data;

ALTER TABLE public.escala
ADD COLUMN folgas_datas date[] DEFAULT '{}',
ADD COLUMN banco_horas_datas date[] DEFAULT '{}';

COMMENT ON COLUMN public.escala.folgas_datas IS 'Array de datas dos dias de folga da pessoa';
COMMENT ON COLUMN public.escala.banco_horas_datas IS 'Array de datas dos dias de banco de horas (folga compensada)';