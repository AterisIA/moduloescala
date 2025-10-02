import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const DEMO_MODE = Deno.env.get("DEMO_MODE") === "true" || true;

// Função para gerar token JWT HS256 manualmente
async function generateToken(payload: Record<string, any>, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Header
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  
  // Payload
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Signature
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const encodedSignature = base64UrlEncode(signature);
  
  return `${message}.${encodedSignature}`;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof data === "string") {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    base64 = btoa(String.fromCharCode(...bytes));
  }
  
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

serve(async (req) => {
  console.log("[qr-token] Requisição recebida:", req.method, req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter kiosk_id (POST ou GET)
    let kioskId: string | null = null;
    
    if (req.method === "POST") {
      const body = await req.json();
      kioskId = body.kiosk_id;
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      kioskId = url.searchParams.get("kiosk_id");
    }

    console.log("[qr-token] kiosk_id:", kioskId);

    if (!kioskId) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "MISSING_KIOSK_ID",
          message: "kiosk_id é obrigatório",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Buscar kiosque
    const { data: kiosk, error: kioskError } = await supabase
      .from("kiosks")
      .select("*")
      .eq("id", kioskId)
      .single();

    if (kioskError || !kiosk) {
      console.error("[qr-token] Erro ao buscar kiosk:", kioskError);
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

    // Gerar janela temporal (minuto atual)
    const now = new Date();
    const window = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Gerar token JWT
    const payload = {
      k: kioskId,
      w: window,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(now.getTime() / 1000) + 120, // 2 minutos
    };

    const token = await generateToken(payload, kiosk.segredo_base32);

    console.log("[qr-token] Token gerado com sucesso para window:", window);

    return new Response(
      JSON.stringify({
        ok: true,
        token,
        window,
        expires_in: 120,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[qr-token] Erro interno:", error);
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
