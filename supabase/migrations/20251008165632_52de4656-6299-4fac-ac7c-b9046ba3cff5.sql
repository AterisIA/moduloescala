-- Remover o constraint antigo
ALTER TABLE attendance_logs 
DROP CONSTRAINT IF EXISTS attendance_logs_status_horario_check;

-- Adicionar o novo constraint com todos os valores possíveis
ALTER TABLE attendance_logs 
ADD CONSTRAINT attendance_logs_status_horario_check 
CHECK (status_horario IN (
  'pontual',
  'atrasado', 
  'fora_escala',
  'entrada_antecipada',
  'saida_antecipada'
));