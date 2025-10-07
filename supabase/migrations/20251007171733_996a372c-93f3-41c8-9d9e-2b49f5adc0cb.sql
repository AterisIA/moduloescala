-- Add foreign key to link face_users with contatos_terceirizacao
ALTER TABLE public.face_users 
ADD COLUMN id_contato_terceirizacao uuid REFERENCES public.contatos_terceirizacao(id);

-- Create index for better query performance
CREATE INDEX idx_face_users_contato ON public.face_users(id_contato_terceirizacao);