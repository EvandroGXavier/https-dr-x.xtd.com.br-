import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OutboxItem {
  id: string
  user_id: string
  message_id: string
  account_id: string
  payload: any
  retry_count: number
  max_retries: number
}

interface WhatsAppAccount {
  id: string
  phone_number_id: string
  waba_id: string
}

interface WhatsAppTokens {
  access_token: string
  app_secret: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('Starting WhatsApp outbox worker...')

    // Get queued messages (limit to prevent timeout)
    const { data: outboxItems, error } = await supabase
      .from('wa_outbox')
      .select(`
        *,
        wa_messages!inner(thread_id, content, message_type),
        wa_accounts!inner(phone_number_id, waba_id)
      `)
      .in('status', ['QUEUED', 'FAILED'])
      .lte('not_before', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      throw new Error(`Failed to fetch outbox items: ${error.message}`)
    }

    if (!outboxItems || outboxItems.length === 0) {
      console.log('No queued messages found')
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${outboxItems.length} queued messages`)

    let processed = 0
    let failed = 0

    for (const item of outboxItems) {
      try {
        await processOutboxItem(supabase, item)
        processed++
      } catch (error) {
        console.error(`Failed to process item ${item.id}:`, error)
        await handleRetry(supabase, item, error instanceof Error ? error.message : String(error))
        failed++
      }
    }

    console.log(`Outbox worker completed. Processed: ${processed}, Failed: ${failed}`)

    return new Response(JSON.stringify({ 
      processed, 
      failed,
      total: outboxItems.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Outbox worker error:', error)
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

async function processOutboxItem(supabase: any, item: any) {
  console.log(`Processing outbox item: ${item.id}`)

  // Mark as processing
  await supabase
    .from('wa_outbox')
    .update({ 
      status: 'PROCESSING',
      last_attempt_at: new Date().toISOString()
    })
    .eq('id', item.id)

  // Get and decrypt access token for the account
  const { data: tokens } = await supabase
    .from('wa_tokens')
    .select('access_token, app_secret')
    .eq('account_id', item.account_id)
    .single()

  if (!tokens) {
    throw new Error('No access token found for account')
  }

  // Decrypt access token using secure encryption
  const { data: accessToken } = await supabase
    .rpc('decrypt_whatsapp_token', {
      encrypted_token: tokens.access_token,
      account_id: item.account_id
    })

  if (!accessToken) {
    throw new Error('Failed to decrypt access token')
  }

  const account = item.wa_accounts
  const phoneNumberId = account.phone_number_id

  // Send message to WhatsApp Cloud API
  const whatsappResponse = await sendToWhatsApp(
    phoneNumberId,
    accessToken,
    item.payload
  )

  if (!whatsappResponse.ok) {
    const errorData = await whatsappResponse.json()
    console.error('WhatsApp API error:', errorData)
    throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`)
  }

  const responseData = await whatsappResponse.json()
  console.log('WhatsApp API response:', responseData)

  // Update message with WhatsApp message ID
  if (responseData.messages && responseData.messages[0]) {
    const waMessageId = responseData.messages[0].id
    
    await supabase
      .from('wa_messages')
      .update({
        wa_message_id: waMessageId,
        status: 'SENT',
        sent_at: new Date().toISOString()
      })
      .eq('id', item.message_id)
  }

  // Mark outbox item as sent
  await supabase
    .from('wa_outbox')
    .update({ status: 'SENT' })
    .eq('id', item.id)

  console.log(`Successfully processed outbox item: ${item.id}`)
}

async function sendToWhatsApp(phoneNumberId: string, accessToken: string, payload: any) {
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
}

async function handleRetry(supabase: any, item: any, errorMessage: string) {
  const newRetryCount = item.retry_count + 1
  
  if (newRetryCount >= item.max_retries) {
    // Max retries reached, mark as failed
    await supabase
      .from('wa_outbox')
      .update({ 
        status: 'FAILED',
        retry_count: newRetryCount,
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', item.id)

    // Update message status
    await supabase
      .from('wa_messages')
      .update({
        status: 'FAILED',
        error_message: errorMessage
      })
      .eq('id', item.message_id)

    console.log(`Message ${item.id} failed after ${newRetryCount} retries`)
  } else {
    // Schedule retry with exponential backoff
    const backoffMinutes = Math.pow(2, newRetryCount) // 2, 4, 8, 16 minutes
    const notBefore = new Date(Date.now() + backoffMinutes * 60 * 1000)

    await supabase
      .from('wa_outbox')
      .update({ 
        status: 'QUEUED',
        retry_count: newRetryCount,
        not_before: notBefore.toISOString(),
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', item.id)

    console.log(`Scheduled retry ${newRetryCount} for item ${item.id} at ${notBefore}`)
  }
}