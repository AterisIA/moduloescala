-- Adicionar colunas para armazenar dias da semana de folga e banco de horas
-- 0 = Domingo, 1 = Segunda, 2 = Terça, 3 = Quarta, 4 = Quinta, 5 = Sexta, 6 = Sábado

ALTER TABLE escala 
ADD COLUMN IF NOT EXISTS folgas_dias_semana integer[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS banco_horas_dias_semana integer[] DEFAULT '{}';