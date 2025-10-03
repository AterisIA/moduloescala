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
    const { nome, matricula, latitude, longitude, images } = await req.json();

    console.log('[Enroll] Recebendo cadastro:', { nome, matricula, latitude, longitude, imageCount: images?.length });

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

    // Usar modelo multimodal para extrair embeddings faciais
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    console.log('[Enroll] Extraindo descritores faciais...');

    // Processar cada imagem para obter descritores
    const descriptors: number[][] = [];
    
    for (const img of images) {
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
                  text: 'Analise esta foto e retorne um array JSON de 128 números entre -1 e 1 representando as características faciais únicas (embedding facial). Cada número deve capturar aspectos específicos como: formato do rosto, olhos, nariz, boca, sobrancelhas, orelhas, cabelo, marcas distintivas. Retorne APENAS o array JSON, sem explicações: [0.123, -0.456, ...]'
                },
                {
                  type: 'image_url',
                  image_url: { url: img }
                }
              ]
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('[Enroll] Erro na IA:', errorText);
        throw new Error('Erro ao extrair descritores faciais');
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices[0].message.content;
      
      // Extrair array JSON da resposta
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (!jsonMatch) {
        console.error('[Enroll] Resposta inválida:', content);
        throw new Error('Formato de resposta inválido');
      }
      
      const descriptor = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(descriptor) || descriptor.length !== 128) {
        throw new Error('Descriptor deve ter exatamente 128 dimensões');
      }
      
      descriptors.push(descriptor);
    }

    // Calcular média dos descritores das 3 imagens
    const avgDescriptor = new Array(128).fill(0);
    for (let i = 0; i < 128; i++) {
      avgDescriptor[i] = descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length;
    }

    console.log('[Enroll] Descritores extraídos e processados');

    // Salvar cadastro com descriptor
    const { data, error } = await supabase
      .from('face_users')
      .insert({
        id: userId,
        nome: nome.trim(),
        matricula: matricula?.trim() || null,
        latitude: latitude,
        longitude: longitude,
        image_paths: imagePaths,
        descriptor: avgDescriptor,
        description: `Face embedding (${avgDescriptor.length} dimensions)`,
        facial_features: {
          analyzed_at: new Date().toISOString(),
          model: 'gemini-2.5-flash-embedding',
          dimensions: avgDescriptor.length
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
