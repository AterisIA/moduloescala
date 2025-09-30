-- Criar função trigger para disparar webhook quando horário coincidir
CREATE OR REPLACE FUNCTION public.trigger_disparo_relatorio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_horario_atual TIME;
BEGIN
    -- Pega o horário atual (apenas HH:MM:SS)
    v_horario_atual := TO_CHAR(NOW(), 'HH24:MI:SS')::TIME;
    
    -- Verifica se o horário atual bate com o horário da linha
    IF NEW.horario::TIME = v_horario_atual THEN
        -- Faz a requisição para o webhook
        PERFORM public.http_post(
            'https://aterisia.app.n8n.cloud/webhook/7d4a336a-898b-45d9-a4e4-3a895d985035',
            json_build_object(
                'tabela', 'DisparoRelatorio'
            )::text,
            'application/json'
        );
        
        RAISE NOTICE 'Webhook disparado para horário: %', NEW.horario;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger na tabela DisparoRelatorio
DROP TRIGGER IF EXISTS trigger_disparo_relatorio_horario ON public."DisparoRelatorio";

CREATE TRIGGER trigger_disparo_relatorio_horario
AFTER INSERT OR UPDATE ON public."DisparoRelatorio"
FOR EACH ROW
EXECUTE FUNCTION public.trigger_disparo_relatorio();