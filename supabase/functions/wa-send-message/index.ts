// 🚀 ERP-LOVABLE — Correção definitiva do envio WhatsApp via Evolution API (2025-10)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

interface SendMessageRequest {
  thread_id?: string
  threadId?: string
  contato_id?: string
  wa_contact_id?: string
  type?: 'text' | 'image' | 'audio' | 'document' | 'video'
  messageType?: string
  text?: string
  content?: { text?: string }
  media_url?: string
  mime?: string
  caption?: string
  user_id?: string
  empresa_id?: string
  filial_id?: string
  eh_nota_interna?: boolean
}

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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body: SendMessageRequest = await req.json()
    
    // Normalizar campos do payload
    const threadId = body.thread_id || body.threadId
    const messageType = (body.type || body.messageType || 'text') as 'text' | 'image' | 'audio' | 'document' | 'video'
    const messageText = body.text || body.content?.text || ''
    
    console.log('📥 Normalized payload:', { threadId, messageType, messageText })
    
    if (!messageType) {
      return new Response(JSON.stringify({ error: 'Missing message type' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Tentar buscar config do usuário primeiro
    let apiUrl = evolutionApiUrl
    let apiKey = evolutionApiKey
    let instanceName: string | undefined
    
    const { data: userConfig } = await supabase
      .from('wa_configuracoes')
      .select('api_endpoint, api_key, instance_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    
    if (userConfig?.api_endpoint && userConfig?.api_key) {
      apiUrl = userConfig.api_endpoint
      apiKey = userConfig.api_key
      instanceName = userConfig.instance_name || instanceName
      console.log('✅ Using user config for Evolution API')
    }

    if (!apiUrl || !apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Evolution API not configured',
        details: 'Configure WhatsApp em Configurações ou adicione EVOLUTION_API_URL e EVOLUTION_API_KEY'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📤 Sending message:', { 
      type: messageType,
      threadId,
      contatoId: body.contato_id,
      waContactId: body.wa_contact_id
    })

    // Get thread and contact info
    let finalThreadId = threadId
    let waContact: any = null
    let phone = ''

    if (finalThreadId) {
      const { data: threadData } = await supabase
        .from('wa_atendimentos')
        .select('*, wa_contacts(*)')
        .eq('id', finalThreadId)
        .eq('user_id', user.id)
        .single()

      if (!threadData) {
        return new Response(JSON.stringify({ error: 'Thread not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      waContact = threadData.wa_contacts
      phone = waContact?.wa_phone_e164 || ''

      // Fallback para obter o nome da instância a partir da conta vinculada à thread
      if (!instanceName && threadData.account_id) {
        const { data: conta } = await supabase
          .from('wa_contas')
          .select('nome_instancia')
          .eq('id', threadData.account_id)
          .maybeSingle()
        if (conta?.nome_instancia) instanceName = conta.nome_instancia
      }
    } else if (body.wa_contact_id) {
      const { data: contactData } = await supabase
        .from('wa_contacts')
        .select('*')
        .eq('id', body.wa_contact_id)
        .single()

      waContact = contactData
      phone = waContact?.wa_phone_e164 || ''

      // Get or create thread
      const { data: existingThread } = await supabase
        .from('wa_atendimentos')
        .select('id')
        .eq('wa_contact_id', body.wa_contact_id)
        .maybeSingle()

      if (existingThread) {
        finalThreadId = existingThread.id
      } else {
        const { data: newThread } = await supabase
          .from('wa_atendimentos')
          .insert({
            user_id: user.id,
            empresa_id: body.empresa_id || null,
            filial_id: body.filial_id || null,
            wa_contact_id: body.wa_contact_id,
            status: 'aberto',
            responsavel_id: user.id,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()

        finalThreadId = newThread?.id
      }
    } else if (body.contato_id) {
      // Get phone from contato_v2
      const { data: meioContato } = await supabase
        .from('contatos_meios_contato')
        .select('valor')
        .eq('contato_id', body.contato_id)
        .eq('tipo', 'Celular')
        .order('principal', { ascending: false })
        .limit(1)
        .maybeSingle()

      phone = meioContato?.valor || ''

      if (!phone) {
        return new Response(JSON.stringify({ error: 'Contact has no phone' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get or create wa_contact
      phone = phone.replace(/\D/g, '')
      const phoneE164 = phone.startsWith('55') ? `+${phone}` : `+55${phone}`

      const { data: existingContact } = await supabase
        .from('wa_contacts')
        .select('id')
        .eq('contato_id', body.contato_id)
        .maybeSingle()

      if (existingContact) {
        waContact = existingContact
      } else {
        const { data: account } = await supabase
          .from('wa_contas')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (!account) {
          return new Response(JSON.stringify({ error: 'No active WhatsApp account' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: newContact } = await supabase
          .from('wa_contacts')
          .insert({
            user_id: user.id,
            account_id: account.id,
            contato_id: body.contato_id,
            wa_phone_e164: phoneE164,
            wa_phone_formatted: phone
          })
          .select('id')
          .single()

        waContact = newContact
      }

      phone = phoneE164

      // Get or create thread
      const { data: existingThread } = await supabase
        .from('wa_atendimentos')
        .select('id')
        .eq('wa_contact_id', waContact.id)
        .maybeSingle()

      if (existingThread) {
        finalThreadId = existingThread.id
      } else {
        const { data: newThread } = await supabase
          .from('wa_atendimentos')
          .insert({
            user_id: user.id,
            empresa_id: body.empresa_id || null,
            filial_id: body.filial_id || null,
            wa_contact_id: waContact.id,
            status: 'aberto',
            responsavel_id: user.id,
            last_message_at: new Date().toISOString()
          })
          .select('id')
          .single()

        finalThreadId = newThread?.id
      }
    } else {
      return new Response(JSON.stringify({ error: 'Must provide thread_id, contato_id or wa_contact_id' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Could not determine phone number' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Format chatId correctly (E.164 + @c.us)
    const cleanPhone = phone.replace(/\D/g, '')
    const chatId = cleanPhone.startsWith('55') 
      ? `${cleanPhone}@c.us` 
      : `55${cleanPhone}@c.us`

    console.log('📱 Chat ID:', chatId)

    // Insert message with QUEUED status first
    const content: any = {
      type: messageType,
      text: messageText || body.caption
    }

    if (body.media_url) {
      content.media_url = body.media_url
      content.mime = body.mime
      if (body.caption) content.caption = body.caption
    }

    const { data: insertedMsg, error: insertErr } = await supabase
      .from('wa_messages')
      .insert({
        user_id: user.id,
        empresa_id: body.empresa_id || null,
        filial_id: body.filial_id || null,
        thread_id: finalThreadId,
        contato_id: body.contato_id || waContact?.contato_id || null,
        direction: 'OUTBOUND',
        message_type: messageType,
        status: 'QUEUED',
        content,
        timestamp: new Date().toISOString(),
        eh_nota_interna: body.eh_nota_interna || false
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('Insert error:', insertErr)
      throw new Error('Failed to create message: ' + insertErr.message)
    }

    const messageLocalId = insertedMsg.id

    // Não enviar se for nota interna
    let success = true
    let waMessageId = null
    let evolutionResult: any = { note: 'internal_note_only' }
    
    if (!body.eh_nota_interna) {
      // Enviar via Evolution API
      const baseUrl = (apiUrl || '').replace(/\/+$/, '')

      let evolutionUrl = ''
      let evolutionBody: any = {}

      if (messageType === 'text') {
        if (!instanceName) {
          return new Response(JSON.stringify({ error: 'Evolution instance not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        evolutionUrl = `${baseUrl}/message/sendText/${instanceName}`
        evolutionBody = { number: cleanPhone, text: messageText }
      } else if (messageType === 'image') {
        if (!instanceName) {
          return new Response(JSON.stringify({ error: 'Evolution instance not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        evolutionUrl = `${baseUrl}/message/sendMedia/${instanceName}`
        evolutionBody = { 
          number: cleanPhone, 
          mediatype: 'image',
          media: body.media_url,
          caption: body.caption || messageText || ''
        }
      } else if (messageType === 'document') {
        if (!instanceName) {
          return new Response(JSON.stringify({ error: 'Evolution instance not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        evolutionUrl = `${baseUrl}/message/sendMedia/${instanceName}`
        evolutionBody = { 
          number: cleanPhone, 
          mediatype: 'document',
          media: body.media_url,
          fileName: messageText || 'documento.pdf',
          caption: body.caption || ''
        }
      } else if (messageType === 'video') {
        if (!instanceName) {
          return new Response(JSON.stringify({ error: 'Evolution instance not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        evolutionUrl = `${baseUrl}/message/sendMedia/${instanceName}`
        evolutionBody = { 
          number: cleanPhone, 
          mediatype: 'video',
          media: body.media_url,
          caption: body.caption || messageText || ''
        }
      } else if (messageType === 'audio') {
        if (!instanceName) {
          return new Response(JSON.stringify({ error: 'Evolution instance not configured' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        evolutionUrl = `${baseUrl}/message/sendMedia/${instanceName}`
        evolutionBody = { 
          number: cleanPhone, 
          mediatype: 'audio',
          media: body.media_url
        }
      } else {
        // Fallback genérico
        evolutionUrl = `${baseUrl}/message/send`
        evolutionBody = { chatId, text: messageText }
      }

      console.log('🚀 Calling Evolution API:', evolutionUrl)

      const evolutionResponse = await fetch(evolutionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey as string
        },
        body: JSON.stringify(evolutionBody)
      })

      evolutionResult = await evolutionResponse.json()

      waMessageId = evolutionResult?.key?.id || evolutionResult?.id || evolutionResult?.messageId || null
      success = evolutionResponse.ok && !!waMessageId
      
      console.log('📨 Evolution result:', { 
        success, 
        waMessageId, 
        status: evolutionResponse.status,
        response: evolutionResult 
      })
    } else {
      console.log('📝 Internal note - not sending to Evolution')
    }

    // Update message with real status
    await supabase
      .from('wa_messages')
      .update({
        status: success ? 'SENT' : 'ERROR',
        wa_message_id: waMessageId,
        sent_at: success ? new Date().toISOString() : null,
        error_message: success ? null : (evolutionResult?.message || 'Evolution API error')
      })
      .eq('id', messageLocalId)

    // Update thread
    if (finalThreadId) {
      await supabase
        .from('wa_atendimentos')
        .update({ 
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', finalThreadId)
    }

    // Log audit
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      event_type: success ? 'whatsapp_message_sent' : 'whatsapp_send_error',
      event_description: success 
        ? `WhatsApp message sent successfully to ${chatId}`
        : `Failed to send WhatsApp message to ${chatId}`,
      metadata: {
        message_id: messageLocalId,
        wa_message_id: waMessageId,
        chat_id: chatId,
        type: body.type,
        evolution_response: evolutionResult
      }
    })

    console.log('✅ Message processed:', messageLocalId)

    return new Response(JSON.stringify({ 
      ok: success,
      status: success ? 'SENT' : 'ERROR',
      chatId,
      messageId: messageLocalId,
      waMessageId,
      threadId: finalThreadId,
      evolution_response: evolutionResult
    }), {
      status: success ? 200 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Send message error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})