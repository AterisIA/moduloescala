-- Remover o trigger antigo que não funciona para horários futuros
DROP TRIGGER IF EXISTS trigger_disparo_relatorio_horario ON public."DisparoRelatorio";
DROP FUNCTION IF EXISTS public.trigger_disparo_relatorio();

-- Criar tabela de controle para evitar disparos duplicados
CREATE TABLE IF NOT EXISTS public.disparo_relatorio_log (
    id BIGSERIAL PRIMARY KEY,
    id_disparo_relatorio BIGINT NOT NULL,
    horario TIME NOT NULL,
    data_disparo DATE NOT NULL,
    disparado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_disparo_relatorio, data_disparo)
);

-- Habilitar RLS na tabela de log
ALTER TABLE public.disparo_relatorio_log ENABLE ROW LEVEL SECURITY;

-- Criar função que verifica horários e dispara webhooks
CREATE OR REPLACE FUNCTION public.verificar_disparos_relatorio()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_horario_atual TIME;
    v_data_atual DATE;
    r RECORD;
    v_response public.http_response;
BEGIN
    -- Pega horário e data atuais
    v_horario_atual := TO_CHAR(NOW(), 'HH24:MI')::TIME;
    v_data_atual := CURRENT_DATE;
    
    -- Busca todos os horários que devem ser disparados agora
    FOR r IN 
        SELECT dr.id, dr.horario
        FROM public."DisparoRelatorio" dr
        WHERE TO_CHAR(dr.horario, 'HH24:MI')::TIME = v_horario_atual
        AND NOT EXISTS (
            SELECT 1 
            FROM public.disparo_relatorio_log drl
            WHERE drl.id_disparo_relatorio = dr.id
            AND drl.data_disparo = v_data_atual
        )
    LOOP
        -- Dispara o webhook
        BEGIN
            v_response := public.http_post(
                'https://aterisia.app.n8n.cloud/webhook/7d4a336a-898b-45d9-a4e4-3a895d985035',
                json_build_object(
                    'tabela', 'DisparoRelatorio',
                    'id', r.id,
                    'horario', r.horario
                )::text,
                'application/json'
            );
            
            -- Registra o disparo no log
            INSERT INTO public.disparo_relatorio_log (id_disparo_relatorio, horario, data_disparo)
            VALUES (r.id, r.horario, v_data_atual);
            
            RAISE NOTICE 'Webhook disparado para ID: %, Horário: %', r.id, r.horario;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao disparar webhook para ID %: %', r.id, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Atualizar ou criar job do pg_cron para verificar a cada minuto
SELECT cron.schedule(
    'verificar_disparos_relatorio',
    '* * * * *',
    $$SELECT public.verificar_disparos_relatorio();$$
);