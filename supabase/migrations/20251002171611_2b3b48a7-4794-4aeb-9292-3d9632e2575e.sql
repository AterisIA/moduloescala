-- Adicionar campos de geolocalização à tabela attendance_logs
ALTER TABLE public.attendance_logs 
  ADD COLUMN geo_lat double precision,
  ADD COLUMN geo_lng double precision,
  ADD COLUMN geo_accuracy double precision,
  ADD COLUMN geo_timestamp timestamptz,
  ADD COLUMN geo_status text,
  ADD COLUMN geo_provider text DEFAULT 'html5';

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.attendance_logs.geo_lat IS 'Latitude da localização (-90 a 90)';
COMMENT ON COLUMN public.attendance_logs.geo_lng IS 'Longitude da localização (-180 a 180)';
COMMENT ON COLUMN public.attendance_logs.geo_accuracy IS 'Precisão em metros';
COMMENT ON COLUMN public.attendance_logs.geo_timestamp IS 'Timestamp da captura de localização';
COMMENT ON COLUMN public.attendance_logs.geo_status IS 'Status: ok, denied, timeout, unavailable, error, low-accuracy';
COMMENT ON COLUMN public.attendance_logs.geo_provider IS 'Provedor de geolocalização (html5, etc)';