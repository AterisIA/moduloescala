-- Adicionar pausa de 1 hora (60 minutos) para todas as escalas ativas
UPDATE public.escala 
SET pausa_minutos = 60 
WHERE finalescala IS NULL OR finalescala >= NOW();