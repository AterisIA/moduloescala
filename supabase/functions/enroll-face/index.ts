import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalizar vetor L2
function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vec : vec.map(v => v / norm);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, matricula, embedding } = await req.json();

    console.log('[Enroll] Recebendo cadastro:', { nome, matricula, embeddingSize: embedding?.length });

    // Validações
    if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'INVALID_NAME',
        message: 'Nome é obrigatório' 
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
    
    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Salvar cadastro facial
    const { data, error } = await supabase
      .from('face_users')
      .insert({
        nome: nome.trim(),
        matricula: matricula?.trim() || null,
        embedding: normalizedEmbedding
      })
      .select()
      .single();

    if (error) {
      console.error('[Enroll] Erro ao salvar:', error);
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'DB_ERROR',
        message: 'Erro ao salvar cadastro' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Enroll] Cadastro criado:', data.id);

    return new Response(JSON.stringify({ 
      ok: true, 
      face_user_id: data.id,
      nome: data.nome
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[Enroll] Erro:', err);
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
