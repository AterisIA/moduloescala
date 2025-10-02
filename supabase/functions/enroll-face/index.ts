import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, matricula, endereco_profissional, images } = await req.json();

    console.log('[Enroll] Recebendo cadastro:', { nome, matricula, endereco_profissional, imageCount: images?.length });

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

    if (!images || !Array.isArray(images) || images.length !== 3) {
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'INVALID_IMAGES', 
        message: 'São necessárias exatamente 3 imagens' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fazer upload das 3 imagens
    const imagePaths: string[] = [];
    const userId = crypto.randomUUID();
    
    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i].split(',')[1]; // Remove "data:image/...;base64,"
      const imageData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const path = `${userId}/image-${i + 1}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('face-images')
        .upload(path, imageData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('[Enroll] Erro no upload:', uploadError);
        throw new Error(`Erro ao fazer upload da imagem ${i + 1}`);
      }

      imagePaths.push(path);
    }

    console.log('[Enroll] Imagens salvas:', imagePaths);

    // Usar Lovable AI para extrair características faciais
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('[Enroll] Analisando características faciais com IA...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise estas 3 fotos da mesma pessoa e descreva DETALHADAMENTE as características faciais únicas que podem ser usadas para identificação: formato do rosto, olhos, nariz, boca, sobrancelhas, orelhas, cabelo, marcas distintivas, etc. Seja extremamente específico e detalhado.'
              },
              ...images.map(img => ({
                type: 'image_url',
                image_url: { url: img }
              }))
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[Enroll] Erro na IA:', errorText);
      throw new Error('Erro ao analisar características faciais');
    }

    const aiData = await aiResponse.json();
    const facialDescription = aiData.choices[0].message.content;

    console.log('[Enroll] Características extraídas');

    // Salvar cadastro
    const { data, error } = await supabase
      .from('face_users')
      .insert({
        id: userId,
        nome: nome.trim(),
        matricula: matricula?.trim() || null,
        endereco_profissional: endereco_profissional?.trim() || null,
        image_paths: imagePaths,
        description: facialDescription,
        facial_features: {
          analyzed_at: new Date().toISOString(),
          model: 'google/gemini-2.5-flash'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('[Enroll] Erro ao salvar:', error);
      // Limpar imagens em caso de erro
      for (const path of imagePaths) {
        await supabase.storage.from('face-images').remove([path]);
      }
      throw new Error('Erro ao salvar cadastro');
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
