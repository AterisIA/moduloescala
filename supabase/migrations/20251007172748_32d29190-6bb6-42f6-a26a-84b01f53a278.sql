-- Add schedule validation fields to attendance_logs
ALTER TABLE public.attendance_logs 
ADD COLUMN escala_id integer,
ADD COLUMN horario_esperado timestamptz,
ADD COLUMN minutos_atraso integer DEFAULT 0,
ADD COLUMN status_horario text DEFAULT 'pontual' CHECK (status_horario IN ('pontual', 'atrasado', 'fora_escala'));

-- Create index for better performance
CREATE INDEX idx_attendance_logs_escala ON public.attendance_logs(escala_id);

COMMENT ON COLUMN public.attendance_logs.escala_id IS 'ID da escala associada ao registro de ponto';
COMMENT ON COLUMN public.attendance_logs.horario_esperado IS 'Horário esperado baseado na escala (entrada ou saída)';
COMMENT ON COLUMN public.attendance_logs.minutos_atraso IS 'Minutos de atraso em relação ao horário esperado';
COMMENT ON COLUMN public.attendance_logs.status_horario IS 'Status: pontual, atrasado ou fora_escala';