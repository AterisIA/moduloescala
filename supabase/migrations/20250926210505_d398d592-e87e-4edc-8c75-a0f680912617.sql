-- Remove a constraint única que está causando erro de chave duplicada
ALTER TABLE public.resposta_comunicacao DROP CONSTRAINT IF EXISTS uniq_resposta_comunicacao;