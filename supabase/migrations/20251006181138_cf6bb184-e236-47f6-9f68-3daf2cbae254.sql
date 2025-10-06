-- Limpar dados existentes da tabela messages_log que têm UUIDs
DELETE FROM public.messages_log;

-- Alterar o tipo da coluna message de UUID para JSONB
ALTER TABLE public.messages_log ALTER COLUMN message DROP DEFAULT;
ALTER TABLE public.messages_log ALTER COLUMN message TYPE jsonb USING '{}'::jsonb;
ALTER TABLE public.messages_log ALTER COLUMN message DROP NOT NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.messages_log.message IS 'Mensagem ou objeto JSON com dados da mensagem do n8n';