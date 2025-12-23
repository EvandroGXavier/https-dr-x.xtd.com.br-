import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRResult {
  success: boolean;
  extractedData?: {
    numero_processo?: string;
    partes?: Array<{
      nome: string;
      papel: string;
    }>;
    comarca?: string;
    tribunal?: string;
    classe?: string;
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileBase64, fileName } = await req.json()

    if (!fileBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Arquivo não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Simular OCR básico usando regex patterns
    const text = extractTextFromBase64(fileBase64)
    const extractedData = parseJuridicalDocument(text)

    const result: OCRResult = {
      success: true,
      extractedData
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('OCR Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro ao processar documento' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractTextFromBase64(base64: string): string {
  // Em uma implementação real, aqui usaríamos Tesseract.js ou outro OCR
  // Por enquanto, simularemos com um texto de exemplo
  return `
    TRIBUNAL DE JUSTIÇA DO ESTADO DE MINAS GERAIS
    Processo nº: 1234567-12.2024.8.13.0001
    Classe: Ação de Cobrança
    Comarca: Belo Horizonte
    Vara: 1ª Vara Cível

    Requerente: João Silva Santos
    CPF: 123.456.789-00
    
    Requerido: Maria Oliveira Costa
    CNPJ: 12.345.678/0001-90
    
    Advogado(a): Dr. Pedro Advogado
    OAB: 12345/MG
  `
}

function parseJuridicalDocument(text: string) {
  const extractedData: any = {}

  // Regex para número CNJ
  const numeroProcessoRegex = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g
  const numeroMatch = text.match(numeroProcessoRegex)
  if (numeroMatch) {
    extractedData.numero_processo = numeroMatch[0]
  }

  // Extrair partes
  const partes: any[] = []
  
  // Requerente/Autor
  const requerenteRegex = /(?:Requerente|Autor(?:a?)):\s*([^\n\r]+)/gi
  const requerenteMatch = text.match(requerenteRegex)
  if (requerenteMatch) {
    requerenteMatch.forEach(match => {
      const nome = match.replace(/(?:Requerente|Autor(?:a?)):\s*/gi, '').trim()
      if (nome) {
        partes.push({ nome, papel: 'cliente' })
      }
    })
  }

  // Requerido/Réu
  const requeridoRegex = /(?:Requerido|Réu|Ré):\s*([^\n\r]+)/gi
  const requeridoMatch = text.match(requeridoRegex)
  if (requeridoMatch) {
    requeridoMatch.forEach(match => {
      const nome = match.replace(/(?:Requerido|Réu|Ré):\s*/gi, '').trim()
      if (nome) {
        partes.push({ nome, papel: 'parte_contraria' })
      }
    })
  }

  // Advogado
  const advogadoRegex = /Advogado(?:a?):\s*([^\n\r]+)/gi
  const advogadoMatch = text.match(advogadoRegex)
  if (advogadoMatch) {
    advogadoMatch.forEach(match => {
      const nome = match.replace(/Advogado(?:a?):\s*/gi, '').trim()
      if (nome) {
        partes.push({ nome, papel: 'advogado' })
      }
    })
  }

  extractedData.partes = partes

  // Comarca
  const comarcaRegex = /Comarca:\s*([^\n\r]+)/gi
  const comarcaMatch = text.match(comarcaRegex)
  if (comarcaMatch) {
    extractedData.comarca = comarcaMatch[0].replace(/Comarca:\s*/gi, '').trim()
  }

  // Tribunal
  const tribunalRegex = /(?:TRIBUNAL|TJ)\s+[^\n\r]+/gi
  const tribunalMatch = text.match(tribunalRegex)
  if (tribunalMatch) {
    extractedData.tribunal = tribunalMatch[0].trim()
  }

  // Classe
  const classeRegex = /Classe:\s*([^\n\r]+)/gi
  const classeMatch = text.match(classeRegex)
  if (classeMatch) {
    extractedData.classe = classeMatch[0].replace(/Classe:\s*/gi, '').trim()
  }

  return extractedData
}