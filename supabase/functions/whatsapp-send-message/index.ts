import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  account_id: string
  wa_id?: string
  link_id?: string
  message_type: string
  body?: string
  media_url?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.json() as SendMessageRequest
    console.log('Send message request:', body)

    // Validate required fields
    if (!body.account_id || (!body.wa_id && !body.link_id)) {
      return new Response(
        JSON.stringify({ error: 'account_id and (wa_id or link_id) are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get WhatsApp account
    const { data: account, error: accountError } = await supabase
      .from('whatsapp_accounts')
      .select('*')
      .eq('id', body.account_id)
      .eq('user_id', user.id)
      .single()

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp account not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check account status (case-insensitive)
    const accountStatus = (account.status || '').toLowerCase()
    if (accountStatus !== 'connected' && accountStatus !== 'CONNECTED'.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp account is not connected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the send attempt
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: 'message_send_attempt',
        event_description: `WhatsApp message send attempt to ${body.wa_id || body.link_id}`,
        metadata: {
          account_id: body.account_id,
          wa_id: body.wa_id,
          link_id: body.link_id,
          message_type: body.message_type,
          body_length: (body.body || '').length,
          timestamp: new Date().toISOString()
        }
      })

    // For now, we'll simulate sending the message
    // In a real implementation, this would call the Evolution API
    console.log('Simulating message send to:', body.wa_id || body.link_id, 'with message:', body.body)

    // Log the successful result
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: 'message_send_result',
        event_description: `WhatsApp message sent successfully (simulated) to ${body.wa_id || body.link_id}`,
        metadata: {
          account_id: body.account_id,
          wa_id: body.wa_id,
          link_id: body.link_id,
          result: 'success_simulated',
          timestamp: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message queued for sending (simulated)',
        message_id: `sim_${Date.now()}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in whatsapp-send-message:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})