-- Adicionar campo de folga na tabela escala
ALTER TABLE public.escala
ADD COLUMN folga_data date NULL;

COMMENT ON COLUMN public.escala.folga_data IS 'Data do dia de folga da pessoa na escala';