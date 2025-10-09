-- Adicionar novas colunas para data e hora separadas
ALTER TABLE public.attendance_logs 
ADD COLUMN data_registro DATE,
ADD COLUMN hora_registro TIME;

-- Migrar dados existentes de created_at para as novas colunas
UPDATE public.attendance_logs 
SET 
  data_registro = created_at::date,
  hora_registro = created_at::time
WHERE data_registro IS NULL;

-- Criar índice para melhorar performance em consultas por data
CREATE INDEX idx_attendance_logs_data_registro ON public.attendance_logs(data_registro);

-- Adicionar trigger para garantir que as novas colunas sejam sempre preenchidas
CREATE OR REPLACE FUNCTION public.set_attendance_date_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data_registro IS NULL THEN
    NEW.data_registro := COALESCE(NEW.created_at::date, CURRENT_DATE);
  END IF;
  
  IF NEW.hora_registro IS NULL THEN
    NEW.hora_registro := COALESCE(NEW.created_at::time, CURRENT_TIME);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_attendance_date_time
BEFORE INSERT OR UPDATE ON public.attendance_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_attendance_date_time();

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.attendance_logs.data_registro IS 'Data do registro de ponto (separada da hora)';
COMMENT ON COLUMN public.attendance_logs.hora_registro IS 'Hora do registro de ponto (separada da data)';