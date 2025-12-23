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
    const { id, status, encerrado_em } = await req.json()
    
    if (!id || !status) {
      return new Response(
        JSON.stringify({ error: 'ID e status são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Obter usuário autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar chamada atual para calcular duração
    const { data: chamadaAtual, error: errorBusca } = await supabaseClient
      .from('chamadas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (errorBusca || !chamadaAtual) {
      return new Response(
        JSON.stringify({ error: 'Chamada não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcular duração em segundos
    const endAt = encerrado_em ? new Date(encerrado_em) : new Date()
    const startAt = new Date(chamadaAtual.iniciado_em)
    const duracao = Math.max(0, Math.round((endAt.getTime() - startAt.getTime()) / 1000))

    // Atualizar chamada
    const { data, error } = await supabaseClient
      .from('chamadas')
      .update({
        status,
        encerrado_em: endAt.toISOString(),
        duracao
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar chamada:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Chamada atualizada:', data)

    return new Response(
      JSON.stringify(data),
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
