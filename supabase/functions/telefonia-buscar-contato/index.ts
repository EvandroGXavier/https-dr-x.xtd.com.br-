import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { telefone } = await req.json()
    
    if (!telefone) {
      return new Response(
        JSON.stringify({ error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Normaliza o número removendo caracteres especiais
    const numeroNormalizado = telefone.replace(/[^0-9]/g, '')
    
    // Busca contato pelo número (últimos dígitos para lidar com variações de DDD/DDI)
    const { data, error } = await supabaseClient
      .from('contato_meios_contato')
      .select(`
        id,
        valor,
        contato_id,
        contatos_v2!inner (
          id,
          nome_fantasia
        )
      `)
      .ilike('valor', `%${numeroNormalizado}%`)
      .limit(1)
      .single()

    if (error) {
      console.error('Erro ao buscar contato:', error)
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // contatos_v2 vem como array do join, pegar primeiro elemento
    const contatosArray = data.contatos_v2 as unknown as { id: string; nome_fantasia: string }[] | null
    const contato = contatosArray?.[0]
    
    if (!contato) {
      return new Response(
        JSON.stringify({ error: 'Contato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        contato_id: contato.id,
        nome: contato.nome_fantasia,
        numero_normalizado: data.valor.replace(/[^0-9]/g, '')
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
