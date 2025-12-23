import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation and sanitization
function validateCNPJ(cnpj: string): string {
  if (!cnpj || typeof cnpj !== 'string') {
    throw new Error('CNPJ é obrigatório');
  }
  
  // Remove all non-numeric characters
  const cnpjNumerico = cnpj.replace(/\D/g, '');
  
  // Validate length
  if (cnpjNumerico.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }
  
  // Check for invalid patterns (all same digits)
  if (/^(\d)\1{13}$/.test(cnpjNumerico)) {
    throw new Error('CNPJ inválido');
  }
  
  return cnpjNumerico;
}

// Rate limiting (simple in-memory store for demo)
const requestLog = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // Max 10 requests per minute per IP
  
  if (!requestLog.has(ip)) {
    requestLog.set(ip, []);
  }
  
  const requests = requestLog.get(ip)!;
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  requestLog.set(ip, validRequests);
  return true;
}

async function consultarBrasilAPI(cnpjNumerico: string) {
  try {
    console.log(`Consultando CNPJ ${cnpjNumerico} via BrasilAPI...`)
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumerico}`)
    
    if (!response.ok) {
      throw new Error(`BrasilAPI erro: ${response.status}`)
    }

    const data = await response.json()
    console.log('BrasilAPI resposta recebida com sucesso')
    
    return {
      nome: data.razao_social || data.nome_fantasia || '',
      nome_fantasia: data.nome_fantasia || '',
      email: data.email || '',
      telefone: data.ddd_telefone_1 || '',
      endereco: `${data.logradouro || ''} ${data.numero || ''} ${data.complemento || ''}`.trim(),
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      uf: data.uf || '',
      cep: data.cep || '',
      situacao: data.situacao_cadastral === 2 ? 'Ativa' : 'Inativa',
      atividade_principal: data.cnae_fiscal_descricao || '',
      data_abertura: data.data_inicio_atividade || '',
      porte: data.porte || '',
      natureza_juridica: data.natureza_juridica || '',
      ativo: data.situacao_cadastral === 2,
      // Campos adicionais completos da BrasilAPI
      situacao_cadastral: data.situacao_cadastral === 2 ? 'Ativa' : 'Inativa',
      porte_empresa: data.porte || '',
      cnae_principal: data.cnae_fiscal_descricao || '',
      cnae_secundarias: data.cnaes_secundarios?.map((c: any) => c.descricao).join('; ') || '',
      capital_social: data.capital_social || 0,
      tipo_logradouro: data.tipo_logradouro || '',
      motivo_situacao_cadastral: data.motivo_situacao_cadastral || '',
      data_situacao_cadastral: data.data_situacao_cadastral || '',
      municipio_ibge: data.codigo_municipio || '',
      ddd_telefone_1: data.ddd_telefone_1 || '',
      ddd_telefone_2: data.ddd_telefone_2 || '',
      ddd_fax: data.ddd_fax || '',
      qualificacao_responsavel: data.qualificacao_do_responsavel || '',
      identificador_matriz_filial: data.identificador_matriz_filial === 1 ? 'Matriz' : 'Filial',
      situacao_especial: data.situacao_especial || '',
      data_situacao_especial: data.data_situacao_especial || ''
    }
  } catch (error) {
    console.log(`BrasilAPI falhou: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

async function consultarReceitaWS(cnpjNumerico: string) {
  try {
    console.log(`Consultando CNPJ ${cnpjNumerico} via ReceitaWS...`)
    const response = await fetch(`https://receitaws.com.br/v1/cnpj/${cnpjNumerico}`)
    
    if (!response.ok) {
      throw new Error(`ReceitaWS erro: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status === 'ERROR') {
      throw new Error(`ReceitaWS erro: ${data.message}`)
    }
    
    console.log('ReceitaWS resposta recebida com sucesso')
    
    return {
      nome: data.nome || '',
      nome_fantasia: data.fantasia || '',
      email: data.email || '',
      telefone: data.telefone || '',
      endereco: `${data.logradouro || ''} ${data.numero || ''} ${data.complemento || ''}`.trim(),
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      estado: data.uf || '',
      uf: data.uf || '',
      cep: data.cep || '',
      situacao: data.situacao || '',
      atividade_principal: data.atividade_principal?.[0]?.text || '',
      data_abertura: data.abertura || '',
      porte: data.porte || '',
      natureza_juridica: data.natureza_juridica || '',
      ativo: data.situacao === 'ATIVA',
      // Campos adicionais completos da ReceitaWS
      situacao_cadastral: data.situacao || '',
      porte_empresa: data.porte || '',
      cnae_principal: data.atividade_principal?.[0]?.text || '',
      cnae_secundarias: data.atividades_secundarias?.map((a: any) => a.text).join('; ') || '',
      capital_social: parseFloat(data.capital_social?.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
      tipo_logradouro: data.tipo_logradouro || '',
      motivo_situacao_cadastral: data.motivo_situacao_cadastral || '',
      data_situacao_cadastral: data.data_situacao_cadastral || '',
      municipio_ibge: data.codigo_municipio_ibge || '',
      ddd_telefone_1: data.telefone?.split(' ')[0]?.replace(/\D/g, '') || '',
      ddd_telefone_2: '',
      ddd_fax: '',
      qualificacao_responsavel: data.qsa?.[0]?.qualificacao || '',
      identificador_matriz_filial: data.tipo === 'MATRIZ' ? 'Matriz' : 'Filial',
      situacao_especial: data.situacao_especial || '',
      data_situacao_especial: data.data_situacao_especial || ''
    }
  } catch (error) {
    console.log(`ReceitaWS falhou: ${error instanceof Error ? error.message : String(error)}`)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente em 1 minuto.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.json().catch(() => ({}));
    const { cnpj } = body;
    
    // Validate and sanitize CNPJ input
    let cnpjNumerico: string;
    try {
      cnpjNumerico = validateCNPJ(cnpj);
    } catch (error) {
      console.log(`CNPJ validation failed: ${error instanceof Error ? error.message : String(error)}`);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let dadosEmpresa
    let fonte = ''

    // Tenta primeiro com BrasilAPI
    try {
      dadosEmpresa = await consultarBrasilAPI(cnpjNumerico)
      fonte = 'BrasilAPI'
    } catch (brasilApiError) {
      console.log('BrasilAPI falhou, tentando ReceitaWS...')
      
      // Se BrasilAPI falhar, tenta ReceitaWS
      try {
        dadosEmpresa = await consultarReceitaWS(cnpjNumerico)
        fonte = 'ReceitaWS'
      } catch (receitaWsError) {
        console.error('Ambas as APIs falharam:', { brasilApiError, receitaWsError })
        
        return new Response(
          JSON.stringify({ 
            error: 'CNPJ não encontrado em nenhuma das fontes de dados',
            details: {
              brasilAPI: brasilApiError instanceof Error ? brasilApiError.message : String(brasilApiError),
              receitaWS: receitaWsError instanceof Error ? receitaWsError.message : String(receitaWsError)
            }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Adiciona o CNPJ aos dados
    (dadosEmpresa as any).cpf_cnpj = cnpj

    return new Response(
      JSON.stringify({ 
        success: true, 
        dados: dadosEmpresa,
        fonte: fonte // Informa qual API foi usada
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na consulta CNPJ:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error) 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})