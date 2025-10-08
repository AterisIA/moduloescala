-- Remover constraint antiga que não permite PAUSA e VOLTA_PAUSA
ALTER TABLE attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_tipo_check;

-- Adicionar nova constraint com todos os tipos permitidos
ALTER TABLE attendance_logs ADD CONSTRAINT attendance_logs_tipo_check 
CHECK (tipo IN ('ENTRADA', 'SAÍDA', 'PAUSA', 'VOLTA_PAUSA'));