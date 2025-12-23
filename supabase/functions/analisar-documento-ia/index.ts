import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, userId, contexto } = await req.json();

    if (!texto || !userId) {
      return new Response(
        JSON.stringify({ error: 'texto e userId são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Análise completa do texto para extrair entidades E dados estratégicos
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Você é um especialista em análise de documentos jurídicos e de identificação brasileiros.
            
            Analise o texto fornecido e retorne um JSON com a seguinte estrutura EXATA:
            {
              "tipo_documento": "CNH" | "RG" | "CPF" | "CONTRATO_SOCIAL" | "CNPJ" | "PETICAO_INICIAL" | "PETICAO" | "OUTROS",
              "dados_extraidos": {
                // Para CNH/RG/CPF:
                "nome_completo": "string ou null",
                "cpf": "string ou null",
                "rg": "string ou null",
                "data_nascimento": "YYYY-MM-DD ou null",
                "nome_mae": "string ou null",
                "orgao_emissor": "string ou null",
                
                // Para CONTRATO_SOCIAL/CNPJ:
                "razao_social": "string ou null",
                "nome_fantasia": "string ou null",
                "cnpj": "string ou null",
                "capital_social": "number ou null",
                "data_constituicao": "YYYY-MM-DD ou null",
                
                // Para PETICAO:
                "numero_processo": "string ou null",
                "partes": {
                  "autor": ["string"],
                  "reu": ["string"]
                },
                "tribunal": "string ou null",
                "comarca": "string ou null",
                "vara": "string ou null",
                "valor_causa": "number ou null (APENAS NÚMERO, SEM FORMATAÇÃO)",
                "tipo_acao": "string ou null",
                "data_distribuicao": "YYYY-MM-DD ou null"
              },
              "resumo": "string com resumo (para petições e contratos) ou null",
              "timeline": [
                { "data": "YYYY-MM-DD", "descricao": "Descrição do evento" }
              ],
              "pontos_atencao": [
                { 
                  "tipo": "PRAZO" | "VALOR" | "DOCUMENTO",
                  "descricao": "Descrição detalhada",
                  "metadados": { "data": "YYYY-MM-DD" ou outros campos relevantes }
                }
              ]
            }
            
            REGRAS CRÍTICAS:
            - Primeiro identifique o tipo_documento analisando o conteúdo
            - Para documentos de identificação (CNH, RG, CPF): extraia todos os dados pessoais
            - Para documentos empresariais (CONTRATO_SOCIAL, CNPJ): extraia dados da empresa
            - Para petições: extraia dados processuais + resumo + timeline + pontos de atenção
            - resumo: Apenas para petições e contratos (null para documentos de identificação)
            - timeline: Apenas para petições (array vazio para outros tipos)
            - pontos_atencao: Apenas para petições (array vazio para outros tipos)
            - Datas: formato YYYY-MM-DD sempre
            - valor_causa: SEMPRE retorne apenas número puro (ex: 1000.50), NUNCA com "R$" ou formatação
            - Se não encontrar informação, use null ou array vazio
            - Priorize precisão e completude
            - IMPORTANTE: Remova TODA formatação monetária - retorne apenas números`
          },
          {
            role: 'user',
            content: `Analise este caso jurídico:\n\n${texto}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const analysisResult = analysisData.choices[0].message.content;

    let extractedData;
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Nenhum JSON válido encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar análise da IA',
          details: analysisResult 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Dados extraídos:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        tipo_documento: extractedData.tipo_documento || 'OUTROS',
        dados_extraidos: extractedData.dados_extraidos || {},
        entidades: extractedData.dados_extraidos || {}, // Mantém compatibilidade com Fase 2
        resumo: extractedData.resumo || null,
        timeline: extractedData.timeline || [],
        pontos_atencao: extractedData.pontos_atencao || [],
        raw_analysis: analysisResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analisar-documento-ia function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
