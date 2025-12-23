import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      modelo_id, 
      variaveis, 
      titulo, 
      tipo_documento,
      contato_id,
      processo_id,
      prompt_customizado 
    } = await req.json();

    console.log('Generating document with data:', { modelo_id, variaveis, titulo, tipo_documento });

    // Buscar modelo se especificado
    let template_content = '';
    let prompt_base = '';
    
    if (modelo_id) {
      const { data: modelo, error: modeloError } = await supabase
        .from('documento_modelos')
        .select('*')
        .eq('id', modelo_id)
        .single();

      if (modeloError) {
        throw new Error(`Erro ao buscar modelo: ${modeloError.message}`);
      }

      template_content = modelo.template_content;
      prompt_base = modelo.prompt_ia || '';
    }

    // Construir prompt final
    let prompt_final = prompt_customizado || prompt_base || 
      `Gere um documento profissional do tipo "${tipo_documento}" com o título "${titulo}".`;

    // Adicionar contexto das variáveis se fornecidas
    if (variaveis && Object.keys(variaveis).length > 0) {
      prompt_final += `\n\nUtilize as seguintes informações:\n`;
      for (const [key, value] of Object.entries(variaveis)) {
        prompt_final += `- ${key}: ${value}\n`;
      }
    }

    // Adicionar template se existe
    if (template_content) {
      prompt_final += `\n\nUse como base o seguinte template:\n${template_content}`;
    }

    prompt_final += `\n\nO documento deve ser bem formatado, profissional e completo. Retorne apenas o conteúdo do documento sem explicações adicionais.`;

    console.log('Final prompt:', prompt_final);

    // Gerar documento com OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente especializado em gerar documentos profissionais. Sempre retorne documentos bem formatados e estruturados.' 
          },
          { role: 'user', content: prompt_final }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const conteudo_gerado = data.choices[0].message.content;

    console.log('Generated content length:', conteudo_gerado.length);

    // Converter conteúdo para base64 para simular arquivo
    const conteudoBlob = new TextEncoder().encode(conteudo_gerado);
    const base64Content = btoa(String.fromCharCode(...conteudoBlob));

    return new Response(JSON.stringify({ 
      conteudo: conteudo_gerado,
      base64: base64Content,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gerar-documento-ia function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});