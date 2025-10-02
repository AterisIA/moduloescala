import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalizar vetor L2
function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vec : vec.map(v => v / norm);
}

// Cosine similarity (assume vetores L2-normalizados)
function cosineSimilarity(a: number[], b: number[]): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

// Verificar JWT token do QR
async function verifyToken(token: string, secret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token inválido');

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  const signature = parts[2];

  if (header.alg !== 'HS256') throw new Error('Algoritmo não suportado');

  const encoder = new TextEncoder();
  const data = encoder.encode(`${parts[0]}.${parts[1]}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const expectedSignature = new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  const expectedB64 = base64UrlEncode(expectedSignature);

  if (expectedB64 !== signature) {
    throw new Error('Assinatura inválida');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expirado');
  }

  return payload;
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return base64Decode(str);
}

function base64UrlEncode(arr: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...arr));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, embedding, device_info, geo } = await req.json();

    console.log('[Verify] Recebendo verificação:', { 
      hasToken: !!token, 
      embeddingSize: embedding?.length,
      hasGeo: !!geo 
    });

    // Validações
    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'INVALID_TOKEN',
        message: 'Token é obrigatório' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length < 64) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'INVALID_EMBEDDING',
        message: 'Embedding inválido (mínimo 64 dimensões)' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalizar embedding
    const normalizedEmbedding = normalizeVector(embedding);

    // Decodificar token
    let payload: any;
    try {
      const parts = token.split('.');
      payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
      console.log('[Verify] Token payload:', payload);
    } catch (err) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'INVALID_TOKEN_FORMAT',
        message: 'Formato de token inválido' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const kioskId = payload.k;
    if (!kioskId) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'MISSING_KIOSK_ID',
        message: 'Token não contém kiosk_id' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Buscar kiosk
    const { data: kiosk, error: kioskError } = await supabase
      .from('kiosks')
      .select('*')
      .eq('id', kioskId)
      .single();

    if (kioskError || !kiosk) {
      console.error('[Verify] Kiosk não encontrado:', kioskId);
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'KIOSK_NOT_FOUND',
        message: 'Kiosk não encontrado' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar assinatura do token
    try {
      await verifyToken(token, kiosk.segredo_base32);
    } catch (err: any) {
      console.error('[Verify] Token inválido:', err.message);
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'INVALID_TOKEN_SIGNATURE',
        message: 'Token inválido ou expirado' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se kiosk está ativo
    if (!kiosk.ativo) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'KIOSK_INACTIVE',
        message: 'Kiosk inativo' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar todos os cadastros faciais
    const { data: faceUsers, error: faceError } = await supabase
      .from('face_users')
      .select('id, nome, matricula, embedding');

    if (faceError) {
      console.error('[Verify] Erro ao buscar cadastros:', faceError);
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'DB_ERROR',
        message: 'Erro ao buscar cadastros faciais' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!faceUsers || faceUsers.length === 0) {
      console.log('[Verify] Nenhum cadastro facial encontrado');
      return new Response(JSON.stringify({ 
        ok: true,
        match: false,
        confidence: 0,
        message: 'Nenhum cadastro facial encontrado'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calcular similaridade com todos os cadastros
    const THRESHOLD = parseFloat(Deno.env.get('FACE_THRESHOLD') || '0.75');
    let bestMatch: { id: string; nome: string; confidence: number } | null = null;

    for (const user of faceUsers) {
      const userEmbedding = normalizeVector(user.embedding);
      const similarity = cosineSimilarity(normalizedEmbedding, userEmbedding);
      
      console.log('[Verify] Similaridade com', user.nome, ':', similarity.toFixed(4));

      if (similarity >= THRESHOLD && (!bestMatch || similarity > bestMatch.confidence)) {
        bestMatch = {
          id: user.id,
          nome: user.nome,
          confidence: similarity
        };
      }
    }

    // Registrar log de reconhecimento
    await supabase.from('face_recognition_logs').insert({
      face_user_id: bestMatch?.id || null,
      confidence: bestMatch?.confidence || 0,
      matched: !!bestMatch,
      kiosk_id: kioskId,
      note: device_info ? JSON.stringify(device_info) : null
    });

    if (bestMatch) {
      console.log('[Verify] Match encontrado:', bestMatch);
      return new Response(JSON.stringify({ 
        ok: true,
        match: true,
        face_user_id: bestMatch.id,
        nome: bestMatch.nome,
        confidence: bestMatch.confidence
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      console.log('[Verify] Nenhum match acima do threshold');
      return new Response(JSON.stringify({ 
        ok: true,
        match: false,
        confidence: 0,
        message: 'Rosto não reconhecido'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (err: any) {
    console.error('[Verify] Erro:', err);
    return new Response(JSON.stringify({ 
      ok: false,
      code: 'INTERNAL_ERROR',
      message: err.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
