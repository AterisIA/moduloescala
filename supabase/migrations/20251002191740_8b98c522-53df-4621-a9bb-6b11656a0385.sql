-- Adicionar campo de endereço profissional na tabela face_users
ALTER TABLE public.face_users 
ADD COLUMN endereco_profissional TEXT;