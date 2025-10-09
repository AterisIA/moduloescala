import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const DEMO_MODE = Deno.env.get("DEMO_MODE") === "true" || true;

// Função para verificar token JWT HS256 manualmente
async function verifyToken(token: string, secret: string): Promise<any> {
  const encoder = new TextEncoder();
  const parts = token.split(".");
  
  if (parts.length !== 3) {
    throw new Error("Token inválido");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Verificar assinatura
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  
  const signature = base64UrlDecode(encodedSignature);
  const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(message));
  
  if (!valid) {
    throw new Error("Assinatura inválida");
  }
  
  // Decodificar payload
  const payloadJson = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(payloadJson);
  
  // Verificar expiração
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expirado");
  }
  
  return payload;
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  console.log("[punch] Requisição recebida:", req.method);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse body
    const { token, selfie_path, face_user_id, face_confidence, device_info, geo, tipo: tipoSolicitado } = await req.json();

    console.log("[punch] Dados recebidos:", { 
      selfie_path, 
      face_user_id, 
      face_confidence, 
      device_info, 
      geo,
      tipo: tipoSolicitado
    });

    if (!token) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "MISSING_TOKEN",
          message: "Token é obrigatório",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificação facial é OBRIGATÓRIA: exigir face_user_id sempre
    if (!face_user_id) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "FACE_VERIFICATION_REQUIRED",
          message: "Verificação facial obrigatória antes de registrar o ponto."
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decodificar token SEM validar assinatura primeiro (para pegar kiosk_id)
    let payload: any;
    try {
      const parts = token.split(".");
      const encodedPayload = parts[1];
      const payloadJson = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
      payload = JSON.parse(payloadJson);
    } catch (err) {
      console.error("[punch] Erro ao decodificar token:", err);
      return new Response(
        JSON.stringify({
          ok: false,
          code: "INVALID_TOKEN",
          message: "Token inválido",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[punch] Token payload:", payload);

    // Buscar kiosque
    const { data: kiosk, error: kioskError } = await supabase
      .from("kiosks")
      .select("*")
      .eq("id", payload.k)
      .single();

    if (kioskError || !kiosk) {
      console.error("[punch] Kiosque não encontrado:", kioskError);
      return new Response(
        JSON.stringify({
          ok: false,
          code: "KIOSK_NOT_FOUND",
          message: "Kiosque não encontrado",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Agora validar assinatura com o segredo do kiosque
    try {
      await verifyToken(token, kiosk.segredo_base32);
    } catch (err: any) {
      console.error("[punch] Erro ao validar token:", err);
      return new Response(
        JSON.stringify({
          ok: false,
          code: "INVALID_TOKEN",
          message: err.message || "Token inválido",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!kiosk.ativo) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "KIOSK_INACTIVE",
          message: "Kiosque inativo",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sempre exigir verificação facial recente
    const { count: facesCount, error: facesCountError } = await supabase
      .from('face_users')
      .select('*', { count: 'exact', head: true });

    if (facesCountError) {
      console.warn('[punch] Erro ao contar cadastros faciais:', facesCountError);
    }

    if ((facesCount ?? 0) === 0) {
      return new Response(
        JSON.stringify({ ok: false, code: 'NO_FACES_ENROLLED', message: 'Nenhum cadastro facial encontrado. Operação bloqueada.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar existência do usuário facial
    const { data: faceUserExists } = await supabase
      .from('face_users')
      .select('id')
      .eq('id', face_user_id)
      .maybeSingle();

    if (!faceUserExists) {
      return new Response(
        JSON.stringify({ ok: false, code: 'FACE_USER_NOT_FOUND', message: 'Cadastro facial não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Checar log de verificação facial recente (últimos 2 minutos) neste kiosque
    const since = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentLog, error: recentErr } = await supabase
      .from('face_recognition_logs')
      .select('id, similarity_score, captured_at')
      .eq('kiosk_id', payload.k)
      .eq('face_user_id', face_user_id)
      .eq('matched', true)
      .gte('captured_at', since)
      .order('captured_at', { ascending: false })
      .limit(1);

    if (recentErr || !recentLog || recentLog.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, code: 'NO_RECENT_FACE_VERIFICATION', message: 'É necessária verificação facial imediata antes do ponto.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sim = Number(recentLog[0].similarity_score) || 0;
    const FACE_THRESHOLD = 0.9;
    if (sim < FACE_THRESHOLD || (typeof face_confidence === 'number' && face_confidence < FACE_THRESHOLD)) {
      return new Response(
        JSON.stringify({ ok: false, code: 'LOW_FACE_CONFIDENCE', message: 'Confiança de reconhecimento insuficiente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se arquivo existe no storage (somente se modo vídeo)
    if (selfie_path) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('attendance-selfies')
        .list(selfie_path.split('/')[0], {
          search: selfie_path.split('/')[1],
        });

      if (fileError || !fileData || fileData.length === 0) {
        console.error('[punch] Arquivo não encontrado:', fileError);
        return new Response(
          JSON.stringify({
            ok: false,
            code: 'SELFIE_NOT_FOUND',
            message: 'Arquivo de vídeo não encontrado',
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      console.log('[punch] Modo reconhecimento facial - sem selfie');
    }

    // Verificar replay (mesma janela temporal) - permitir tipos diferentes
    const { data: existingLog, error: logError } = await supabase
      .from("attendance_logs")
      .select("tipo")
      .eq("kiosk_id", payload.k)
      .eq("token_window", payload.w)
      .order("punched_at", { ascending: false })
      .limit(1);

    if (logError) {
      console.error("[punch] Erro ao verificar replay:", logError);
    } else if (existingLog && existingLog.length > 0) {
      // Só bloquear se for o mesmo tipo na mesma janela
      const tipoExistente = existingLog[0].tipo;
      
      // Se não temos tipoSolicitado ainda, precisamos determiná-lo primeiro
      const tipoARegistrar = tipoSolicitado || (
        !existingLog || existingLog.length === 0 || tipoExistente === "SAÍDA" || tipoExistente === "VOLTA_PAUSA"
          ? "ENTRADA" 
          : "SAÍDA"
      );
      
      if (tipoExistente === tipoARegistrar) {
        return new Response(
          JSON.stringify({
            ok: false,
            code: "REPLAY_WINDOW",
            message: `${tipoARegistrar} já registrada nesta janela temporal`,
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Determinar tipo baseado no parâmetro solicitado ou último registro
    const { data: lastPunch } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("kiosk_id", payload.k)
      .order("punched_at", { ascending: false })
      .limit(1);

    // Se tipo foi especificado, usar ele; senão, determinar automaticamente
    let tipo = tipoSolicitado;
    if (!tipo) {
      // Verificar se último registro foi SAÍDA ou VOLTA_PAUSA
      const ultimoTipo = lastPunch?.[0]?.tipo;
      tipo = !lastPunch || lastPunch.length === 0 || ultimoTipo === "SAÍDA" 
        ? "ENTRADA" 
        : ultimoTipo === "ENTRADA" || ultimoTipo === "VOLTA_PAUSA"
        ? "SAÍDA"
        : "ENTRADA";
    }

    console.log("[punch] Tipo determinado:", tipo);

    // Calcular tempos acumulados do dia
    const hoje = new Date().toISOString().split('T')[0];
    const { data: punchesToday } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("kiosk_id", payload.k)
      .gte("punched_at", hoje)
      .order("punched_at", { ascending: true });

    let tempoTrabalho = 0;
    let tempoPausa = 0;
    let estadoPonto = tipo === 'ENTRADA' ? 'ENTRADA' : null;

    if (punchesToday && punchesToday.length > 0) {
      // Calcular tempo trabalhado baseado nos registros do dia
      for (let i = 0; i < punchesToday.length; i++) {
        const punch = punchesToday[i];
        const nextPunch = i < punchesToday.length - 1 ? punchesToday[i + 1] : null;
        
        if (punch.tipo === 'ENTRADA' && nextPunch) {
          const start = new Date(punch.punched_at).getTime();
          const end = new Date(nextPunch.punched_at).getTime();
          const diffSeconds = Math.floor((end - start) / 1000);
          
          if (nextPunch.tipo === 'SAÍDA') {
            tempoTrabalho += diffSeconds;
          } else if (nextPunch.tipo === 'PAUSA') {
            tempoTrabalho += diffSeconds;
          }
        } else if (punch.tipo === 'PAUSA' && nextPunch?.tipo === 'VOLTA_PAUSA') {
          const start = new Date(punch.punched_at).getTime();
          const end = new Date(nextPunch.punched_at).getTime();
          tempoPausa += Math.floor((end - start) / 1000);
        }
      }
      
      // Se o tipo agora é ENTRADA, adicionar tempo até agora
      if (tipo === 'ENTRADA') {
        const ultimoPunch = punchesToday[punchesToday.length - 1];
        if (ultimoPunch.tipo === 'ENTRADA') {
          const start = new Date(ultimoPunch.punched_at).getTime();
          const now = Date.now();
          tempoTrabalho += Math.floor((now - start) / 1000);
        }
      }
    }

    // Validar e processar geolocalização
    let geoData: any = {
      geo_lat: null,
      geo_lng: null,
      geo_accuracy: null,
      geo_timestamp: null,
      geo_status: geo?.status || null,
      geo_provider: 'html5',
    };

    if (geo && geo.status === 'ok' && geo.lat !== null && geo.lng !== null) {
      // Validar plausibilidade
      const lat = typeof geo.lat === 'number' ? geo.lat : parseFloat(geo.lat);
      const lng = typeof geo.lng === 'number' ? geo.lng : parseFloat(geo.lng);
      const accuracy = typeof geo.accuracy === 'number' ? geo.accuracy : parseFloat(geo.accuracy);
      const geoTimestamp = typeof geo.timestamp === 'number' ? geo.timestamp : parseInt(geo.timestamp);

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('[punch] Coordenadas inválidas:', { lat, lng });
        geoData.geo_status = 'error';
      } else if (isNaN(accuracy) || accuracy > 1000) {
        console.warn('[punch] Precisão baixa:', accuracy);
        geoData.geo_lat = lat;
        geoData.geo_lng = lng;
        geoData.geo_accuracy = accuracy;
        geoData.geo_timestamp = new Date(geoTimestamp).toISOString();
        geoData.geo_status = 'low-accuracy';
      } else {
        // Verificar se timestamp não é muito antigo (5 minutos)
        const now = Date.now();
        const ageMs = now - geoTimestamp;
        if (ageMs > 5 * 60 * 1000) {
          console.warn('[punch] Geolocalização antiga:', ageMs / 1000, 'segundos');
          geoData.geo_status = 'stale';
        }

        geoData.geo_lat = lat;
        geoData.geo_lng = lng;
        geoData.geo_accuracy = accuracy;
        geoData.geo_timestamp = new Date(geoTimestamp).toISOString();
        if (!geoData.geo_status || geoData.geo_status === 'ok') {
          geoData.geo_status = 'ok';
        }
      }
    }

    console.log('[punch] Dados de geo a serem salvos:', geoData);

    // Buscar escala da pessoa para validar horário
    let scheduleData: any = {
      escala_id: null,
      horario_esperado: null,
      minutos_atraso: 0,
      status_horario: 'pontual',
    };

    if (face_user_id) {
      // Buscar face_user para pegar id_contato_terceirizacao
      const { data: faceUser } = await supabase
        .from('face_users')
        .select('id_contato_terceirizacao')
        .eq('id', face_user_id)
        .single();

      if (faceUser?.id_contato_terceirizacao) {
        // Buscar escala ativa para esse contato
        // dataescala contém a hora de INÍCIO do expediente
        // finalescala contém a DATA FINAL do contrato (não a hora de saída diária)
        const now = new Date();
        const hojeBRT = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const hoje = new Date(hojeBRT);
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        
        const { data: escalas } = await supabase
          .from('escala')
          .select('idescala, dataescala, finalescala')
          .eq('id_contato_terceirizacao', faceUser.id_contato_terceirizacao)
          .lte('dataescala', fimDia.toISOString())
          .gte('finalescala', inicioDia.toISOString())
          .order('dataescala', { ascending: false })
          .limit(1);

        if (escalas && escalas.length > 0) {
          const escala = escalas[0];
          scheduleData.escala_id = escala.idescala;

          // Extrair apenas hora e minuto dos timestamps e interpretar no fuso de São Paulo
          // O timestamp no banco é 'timestamp without time zone', então precisamos interpretar como local BRT
          const dataEscalaStr = escala.dataescala; // ex: '2025-10-06 08:00:00'
          const finalEscalaStr = escala.finalescala; // ex: '2025-11-05 17:00:00'
          
          // Extrair hora e minuto usando regex para garantir interpretação correta
          const entradaMatch = dataEscalaStr.match(/(\d{2}):(\d{2}):(\d{2})/);
          const saidaMatch = finalEscalaStr.match(/(\d{2}):(\d{2}):(\d{2})/);
          
          if (!entradaMatch || !saidaMatch) {
            console.error('[punch] Formato de horário inválido na escala');
            scheduleData.status_horario = 'fora_escala';
          } else {
            const horaEntrada = parseInt(entradaMatch[1]);
            const minutoEntrada = parseInt(entradaMatch[2]);
            const horaSaida = parseInt(saidaMatch[1]);
            const minutoSaida = parseInt(saidaMatch[2]);
            
            // Criar timestamps em BRT/BRST - interpretando as horas como horário de São Paulo
            const hoje = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
            const [datePart] = hoje.split(', ');
            const [mes, dia, ano] = datePart.split('/');
            
            // Criar strings de timestamp no formato ISO sem timezone (será interpretado como local)
            const horarioEntradaStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaEntrada.toString().padStart(2, '0')}:${minutoEntrada.toString().padStart(2, '0')}:00`;
            const horarioSaidaStr = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${horaSaida.toString().padStart(2, '0')}:${minutoSaida.toString().padStart(2, '0')}:00`;
            
            console.log(`[punch] Horários da escala - Entrada: ${horaEntrada}:${minutoEntrada}, Saída: ${horaSaida}:${minutoSaida}`);
            console.log(`[punch] Timestamps criados - Entrada: ${horarioEntradaStr}, Saída: ${horarioSaidaStr}`);

            if (tipo === 'ENTRADA') {
              scheduleData.horario_esperado = horarioEntradaStr;
              // Comparar com horário atual em BRT
              const agoraEmBRT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
              const entradaEmBRT = new Date(horarioEntradaStr);
              const diffMs = agoraEmBRT.getTime() - entradaEmBRT.getTime();
              const diffMin = Math.floor(diffMs / 60000);
              
              if (diffMin > 0) {
                scheduleData.minutos_atraso = diffMin;
                scheduleData.status_horario = 'atrasado';
                console.log(`[punch] ENTRADA com atraso de ${diffMin} minutos`);
              } else {
                scheduleData.minutos_atraso = 0;
                console.log(`[punch] ENTRADA pontual ou adiantada`);
              }
            } else if (tipo === 'SAÍDA') {
              scheduleData.horario_esperado = horarioSaidaStr;
              // Comparar com horário atual em BRT
              const agoraEmBRT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
              const saidaEmBRT = new Date(horarioSaidaStr);
              const diffMs = agoraEmBRT.getTime() - saidaEmBRT.getTime();
              const diffMin = Math.floor(diffMs / 60000);
              
              // Para SAÍDA: só marca atraso se saiu DEPOIS do horário esperado
              if (diffMin > 0) {
                scheduleData.minutos_atraso = diffMin;
                scheduleData.status_horario = 'atrasado';
                console.log(`[punch] SAÍDA com atraso de ${diffMin} minutos`);
              } else {
                // Saiu antes ou no horário - não é atraso
                scheduleData.minutos_atraso = 0;
                scheduleData.status_horario = diffMin < -10 ? 'saida_antecipada' : 'pontual';
                console.log(`[punch] SAÍDA ${diffMin < -10 ? 'antecipada' : 'pontual'} (${Math.abs(diffMin)} minutos antes)`);
              }
            }
          }
        } else {
          scheduleData.status_horario = 'fora_escala';
          console.log('[punch] Nenhuma escala ativa encontrada para esta data');
        }
      }
    }

    console.log('[punch] Dados de escala calculados:', scheduleData);

    // Calcular banco de horas
    let bancoHorasMinutos = 0;
    
    if (scheduleData.escala_id && tipo === 'SAÍDA') {
      // Buscar escala para pegar horário completo
      const { data: escalaCompleta } = await supabase
        .from('escala')
        .select('dataescala, finalescala, pausa_minutos')
        .eq('idescala', scheduleData.escala_id)
        .single();
      
      if (escalaCompleta) {
        // Calcular horas devidas (fim - início)
        const dataEscalaDate = new Date(escalaCompleta.dataescala);
        const finalEscalaDate = new Date(escalaCompleta.finalescala);
        
        // Diferença em minutos entre início e fim da escala
        const minutosTotaisEscala = Math.floor((finalEscalaDate.getTime() - dataEscalaDate.getTime()) / 60000);
        
        // Buscar ENTRADA e SAÍDA do dia de hoje
        const hojeBRT = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const hoje = new Date(hojeBRT);
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        
        const { data: punchesHoje } = await supabase
          .from('attendance_logs')
          .select('tipo, punched_at, tempo_pausa_segundos')
          .eq('face_user_id', face_user_id)
          .gte('punched_at', inicioDia.toISOString())
          .lte('punched_at', fimDia.toISOString())
          .order('punched_at', { ascending: true });
        
        if (punchesHoje && punchesHoje.length > 0) {
          const entrada = punchesHoje.find(p => p.tipo === 'ENTRADA');
          
          if (entrada) {
            // Calcular minutos trabalhados (SAÍDA atual - ENTRADA)
            const entradaDate = new Date(entrada.punched_at);
            const saidaDate = new Date(); // agora
            const minutosTrabalhadosTotal = Math.floor((saidaDate.getTime() - entradaDate.getTime()) / 60000);
            
            // Descontar pausa (já incluída na escala)
            const pausaMinutos = escalaCompleta.pausa_minutos || 60;
            const minutosTrabalhadosLiquido = minutosTrabalhadosTotal - pausaMinutos;
            
            // Banco de horas = trabalhado - devido
            bancoHorasMinutos = minutosTrabalhadosLiquido - minutosTotaisEscala;
            
            console.log(`[punch] Cálculo banco de horas: trabalhado=${minutosTrabalhadosLiquido}min, devido=${minutosTotaisEscala}min, banco=${bancoHorasMinutos}min`);
          }
        }
      }
    }

    // Gravar log com geolocalização, reconhecimento facial, validação de horário e estado
    const { data: log, error: insertError } = await supabase
      .from("attendance_logs")
      .insert({
        kiosk_id: payload.k,
        tipo,
        selfie_path: selfie_path || null,
        face_user_id: face_user_id || null,
        face_confidence: face_confidence || null,
        device_info,
        token_window: payload.w,
        estado_ponto: estadoPonto,
        tempo_trabalho_segundos: tempoTrabalho,
        tempo_pausa_segundos: tempoPausa,
        banco_horas_minutos: bancoHorasMinutos,
        ...geoData,
        ...scheduleData,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[punch] Erro ao gravar log:", insertError);
      return new Response(
        JSON.stringify({
          ok: false,
          code: "INSERT_ERROR",
          message: "Erro ao registrar batida",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[punch] Batida registrada com sucesso:", log.id);

    // Buscar dados do face_user se houver face_user_id
    let faceUserData = null;
    if (face_user_id) {
      const { data: faceUser } = await supabase
        .from("face_users")
        .select("id, nome, matricula, latitude, longitude")
        .eq("id", face_user_id)
        .single();
      
      if (faceUser) {
        faceUserData = faceUser;
        console.log("[punch] Dados do face_user incluídos na resposta");
      }
    }

    // Construir mensagem de resposta com informações de atraso
    let message = `${tipo} registrada com sucesso`;
    if (scheduleData.status_horario === 'atrasado') {
      message += ` (${scheduleData.minutos_atraso} minutos de atraso)`;
    } else if (scheduleData.status_horario === 'saida_antecipada') {
      message += ` (saída antecipada)`;
    } else if (scheduleData.status_horario === 'fora_escala') {
      message += ` (fora do horário de escala)`;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        tipo,
        punched_at: log.punched_at,
        message,
        face_user: faceUserData,
        schedule_info: {
          status: scheduleData.status_horario,
          minutos_atraso: scheduleData.minutos_atraso,
          horario_esperado: scheduleData.horario_esperado,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[punch] Erro interno:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        code: "INTERNAL_ERROR",
        message: error.message || "Erro interno do servidor",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
