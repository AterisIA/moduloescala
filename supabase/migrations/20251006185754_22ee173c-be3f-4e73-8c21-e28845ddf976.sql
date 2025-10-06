-- Adicionar campo para associar escalas com contatos de terceirização
ALTER TABLE public.escala
ADD COLUMN id_contato_terceirizacao uuid REFERENCES public.contatos_terceirizacao(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.escala.id_contato_terceirizacao IS 'Referência ao contato de terceirização associado a esta escala';

-- Criar índice para melhor performance nas consultas
CREATE INDEX idx_escala_contato_terceirizacao ON public.escala(id_contato_terceirizacao);