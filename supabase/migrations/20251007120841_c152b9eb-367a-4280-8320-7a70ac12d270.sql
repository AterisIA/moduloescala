-- Add domingo_mes field to escala table
ALTER TABLE escala 
ADD COLUMN domingo_mes integer;

COMMENT ON COLUMN escala.domingo_mes IS 'Qual domingo do mês é folga (1=primeiro, 2=segundo, 3=terceiro, 4=quarto, 5=quinto)';