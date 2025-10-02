-- Adicionar colunas de latitude e longitude na tabela face_users
ALTER TABLE public.face_users 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Tornar endereco_profissional opcional (já é, mas deixando explícito)
COMMENT ON COLUMN public.face_users.latitude IS 'Latitude do local de trabalho';
COMMENT ON COLUMN public.face_users.longitude IS 'Longitude do local de trabalho';
COMMENT ON COLUMN public.face_users.endereco_profissional IS 'Endereço profissional (referência visual opcional)';