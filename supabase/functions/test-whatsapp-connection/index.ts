import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { api_endpoint, api_key, instance_name } = await req.json()
    
    if (!api_endpoint || !api_key || !instance_name) {
      throw new Error('Parâmetros obrigatórios: api_endpoint, api_key, instance_name')
    }

    console.log('Testando conexão com Evolution API:', { api_endpoint, instance_name })

    // Teste 1: Verificar status da instância
    const instanceResponse = await fetch(`${api_endpoint}/instance/connectionState/${instance_name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': api_key,
      },
    })

    if (!instanceResponse.ok) {
      const errorText = await instanceResponse.text()
      console.error('Erro ao verificar instância:', errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Falha na conexão: ${instanceResponse.status}`,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const instanceData = await instanceResponse.json()
    console.log('Status da instância:', instanceData)

    // Teste 2: Verificar se a instância está conectada
    const isConnected = instanceData?.instance?.state === 'open'
    
    if (!isConnected) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Instância não está conectada ao WhatsApp',
          details: `Status atual: ${instanceData?.instance?.state || 'unknown'}`,
          qr_needed: instanceData?.instance?.state === 'close'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sucesso - instância conectada
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conexão com WhatsApp estabelecida com sucesso',
        instance_state: instanceData?.instance?.state,
        instance_name: instance_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no teste de conexão:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})