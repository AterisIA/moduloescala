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
    const { token, selfie_path, face_user_id, face_confidence, device_info, geo } = await req.json();

    console.log("[punch] Dados recebidos:", { 
      selfie_path, 
      face_user_id, 
      face_confidence, 
      device_info, 
      geo 
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

    // Aceitar selfie_path OU face_user_id (modo facial)
    if (!selfie_path && !face_user_id) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "MISSING_IDENTIFICATION",
          message: "selfie_path ou face_user_id é obrigatório",
        }),
        {
          status: 400,
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

    // Verificar se arquivo existe no storage (somente se modo vídeo)
    if (selfie_path) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from("attendance-selfies")
        .list(selfie_path.split("/")[0], {
          search: selfie_path.split("/")[1],
        });

      if (fileError || !fileData || fileData.length === 0) {
        console.error("[punch] Arquivo não encontrado:", fileError);
        return new Response(
          JSON.stringify({
            ok: false,
            code: "SELFIE_NOT_FOUND",
            message: "Arquivo de vídeo não encontrado",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log("[punch] Modo reconhecimento facial - sem selfie");
    }

    // Verificar replay (mesma janela temporal)
    const { data: existingLog, error: logError } = await supabase
      .from("attendance_logs")
      .select("id")
      .eq("kiosk_id", payload.k)
      .eq("token_window", payload.w)
      .limit(1);

    if (logError) {
      console.error("[punch] Erro ao verificar replay:", logError);
    } else if (existingLog && existingLog.length > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "REPLAY_WINDOW",
          message: "Ponto já registrado nesta janela temporal",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determinar tipo (ENTRADA ou SAÍDA) baseado no último registro
    const { data: lastPunch } = await supabase
      .from("attendance_logs")
      .select("tipo")
      .eq("kiosk_id", payload.k)
      .order("punched_at", { ascending: false })
      .limit(1);

    const tipo = !lastPunch || lastPunch.length === 0 || lastPunch[0].tipo === "SAÍDA" 
      ? "ENTRADA" 
      : "SAÍDA";

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
      const lat = parseFloat(geo.lat);
      const lng = parseFloat(geo.lng);
      const accuracy = parseFloat(geo.accuracy);
      const geoTimestamp = parseInt(geo.timestamp);

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

    // Gravar log com geolocalização e dados de reconhecimento facial
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
        ...geoData,
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

    return new Response(
      JSON.stringify({
        ok: true,
        tipo,
        punched_at: log.punched_at,
        message: `${tipo} registrada com sucesso`,
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
