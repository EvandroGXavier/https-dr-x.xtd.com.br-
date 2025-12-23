import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const { messageId, threadId } = await req.json()

    if (!messageId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing messageId' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get message details
    const { data: message, error: msgError } = await supabase
      .from('wa_messages')
      .select('wa_message_id, thread_id')
      .eq('id', messageId)
      .single()

    if (msgError || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Message not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get thread and account info separately
    const { data: threadData } = await supabase
      .from('wa_atendimentos')
      .select('account_id')
      .eq('id', message.thread_id)
      .single()

    const { data: account } = await supabase
      .from('wa_contas')
      .select('nome_instancia, evolution_api_url, evolution_api_key')
      .eq('id', threadData?.account_id)
      .single()

    if (!account || !account.evolution_api_url || !account.evolution_api_key) {
      return new Response(
        JSON.stringify({ ok: false, error: 'WhatsApp account not configured' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Evolution API to mark message as read
    const evolutionUrl = `${account.evolution_api_url}/message/read`
    const evolutionResponse = await fetch(evolutionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': account.evolution_api_key
      },
      body: JSON.stringify({
        messageId: message.wa_message_id,
        instance: account.nome_instancia
      })
    })

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Evolution API error:', errorText)
      throw new Error(`Evolution API error: ${evolutionResponse.status}`)
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('wa_messages')
      .update({ 
        status: 'READ', 
        read_at: new Date().toISOString() 
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Failed to update local status:', updateError)
    }

    // Log audit
    await supabase.from('security_audit_log').insert({
      user_id: null,
      event_type: 'wa_mark_read',
      event_description: 'Message marked as read',
      metadata: {
        message_id: messageId,
        wa_message_id: message.wa_message_id,
        timestamp: new Date().toISOString()
      }
    })

    console.log(`✅ Message ${messageId} marked as read`)

    return new Response(
      JSON.stringify({ ok: true }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Mark read error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
