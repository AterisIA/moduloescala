-- Adicionar campos necessários para controle de pausas e banco de horas na tabela attendance_logs
ALTER TABLE public.attendance_logs
ADD COLUMN IF NOT EXISTS estado_ponto TEXT CHECK (estado_ponto IN ('ENTRADA', 'PAUSA', 'VOLTA_PAUSA', 'SAIDA')),
ADD COLUMN IF NOT EXISTS tempo_trabalho_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tempo_pausa_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS banco_horas_minutos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS horario_previsto TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.attendance_logs.estado_ponto IS 'Estado do registro: ENTRADA, PAUSA, VOLTA_PAUSA ou SAIDA';
COMMENT ON COLUMN public.attendance_logs.tempo_trabalho_segundos IS 'Tempo acumulado de trabalho em segundos';
COMMENT ON COLUMN public.attendance_logs.tempo_pausa_segundos IS 'Tempo acumulado de pausa em segundos';
COMMENT ON COLUMN public.attendance_logs.banco_horas_minutos IS 'Saldo do banco de horas em minutos (pode ser positivo ou negativo)';
COMMENT ON COLUMN public.attendance_logs.horario_previsto IS 'Horário previsto na escala para comparação';
COMMENT ON COLUMN public.attendance_logs.observacoes IS 'Observações sobre o registro (ex: atraso, crédito de horas)';