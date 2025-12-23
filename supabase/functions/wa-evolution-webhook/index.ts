import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EvolutionMessage {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: {
    conversation?: string
    imageMessage?: {
      caption?: string
      mimetype?: string
      url?: string
      fileLength?: number
    }
    videoMessage?: {
      caption?: string
      mimetype?: string
      url?: string
      fileLength?: number
    }
    audioMessage?: {
      mimetype?: string
      url?: string
      fileLength?: number
      seconds?: number
      ptt?: boolean
    }
    documentMessage?: {
      caption?: string
      mimetype?: string
      url?: string
      fileLength?: number
      fileName?: string
    }
  }
  messageTimestamp: number
  pushName?: string
  instance: string
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

  try {
    const body = await req.text()
    const payload = JSON.parse(body)
    
    console.log('📥 Evolution webhook received:', payload)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (payload.event === 'messages.upsert' && payload.data) {
      const items = Array.isArray(payload.data) ? payload.data : [payload.data]
      for (const messageData of items) {
        await processEvolutionMessage(supabase, messageData, payload.instance)
      }
    }

    return new Response('OK', { headers: corsHeaders })

  } catch (error) {
    console.error('❌ Evolution webhook error:', error)
    return new Response('Internal Server Error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

interface MediaUploadResult {
  signedUrl: string
  storagePath: string
}

async function downloadAndUploadMedia(
  supabase: any,
  mediaUrl: string,
  userId: string,
  fileName: string,
  mimeType: string
): Promise<MediaUploadResult> {
  try {
    console.log('📥 Downloading media from:', mediaUrl)
    
    const response = await fetch(mediaUrl)
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`)
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    const storagePath = `${userId}/${Date.now()}_${fileName}`
    
    console.log('📤 Uploading to storage:', storagePath)
    
    const { error: uploadError } = await supabase.storage
      .from('wa-midia')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    // Criar URL assinada com 1 hora de validade
    const { data: signedUrlData, error: signError } = await supabase.storage
      .from('wa-midia')
      .createSignedUrl(storagePath, 3600) // 1 hora de validade
    
    if (signError) throw signError
    
    console.log('✅ Media uploaded successfully with signed URL')
    
    return {
      signedUrl: signedUrlData.signedUrl,
      storagePath
    }
  } catch (error) {
    console.error('❌ Media download/upload error:', error)
    throw error
  }
}

async function processEvolutionMessage(supabase: any, messageData: EvolutionMessage, instanceName: string) {
  console.log('🔄 Processing Evolution message:', messageData.key.id)

  // Get account by instance name
  const { data: account, error: accountError } = await supabase
    .from('wa_contas')
    .select('*')
    .eq('nome_instancia', instanceName)
    .single()
  
  if (accountError || !account) {
    console.error('❌ Account not found for instance:', instanceName)
    return
  }

  const phoneRaw = messageData.key.remoteJid.replace('@s.whatsapp.net', '')
  const phoneE164 = phoneRaw.startsWith('+') ? phoneRaw : `+${phoneRaw}`
  const isFromMe = messageData.key.fromMe
  
  // Extract message content and type
  let messageContent = ''
  let messageType = 'text'
  let mediaUrl: string | undefined
  let storagePath: string | undefined
  let mimeType: string | undefined
  let fileName: string | undefined
  let fileSize: number | undefined
  let duration: number | undefined
  let caption: string | undefined
  
  if (messageData.message?.conversation) {
    messageContent = messageData.message.conversation
    messageType = 'text'
  } else if (messageData.message?.imageMessage) {
    const img = messageData.message.imageMessage
    messageType = 'image'
    caption = img.caption
    messageContent = caption || '[Imagem]'
    mimeType = img.mimetype
    fileSize = img.fileLength
    
    if (img.url) {
      try {
        const result = await downloadAndUploadMedia(
          supabase,
          img.url,
          account.user_id,
          `image_${Date.now()}.${mimeType?.split('/')[1] || 'jpg'}`,
          mimeType || 'image/jpeg'
        )
        mediaUrl = result.signedUrl
        storagePath = result.storagePath
      } catch (error) {
        console.error('Failed to process image:', error)
      }
    }
  } else if (messageData.message?.videoMessage) {
    const vid = messageData.message.videoMessage
    messageType = 'video'
    caption = vid.caption
    messageContent = caption || '[Vídeo]'
    mimeType = vid.mimetype
    fileSize = vid.fileLength
    
    if (vid.url) {
      try {
        const result = await downloadAndUploadMedia(
          supabase,
          vid.url,
          account.user_id,
          `video_${Date.now()}.${mimeType?.split('/')[1] || 'mp4'}`,
          mimeType || 'video/mp4'
        )
        mediaUrl = result.signedUrl
        storagePath = result.storagePath
      } catch (error) {
        console.error('Failed to process video:', error)
      }
    }
  } else if (messageData.message?.audioMessage) {
    const aud = messageData.message.audioMessage
    messageType = 'audio'
    messageContent = '[Áudio]'
    mimeType = aud.mimetype
    fileSize = aud.fileLength
    duration = aud.seconds
    
    if (aud.url) {
      try {
        const result = await downloadAndUploadMedia(
          supabase,
          aud.url,
          account.user_id,
          `audio_${Date.now()}.${mimeType?.split('/')[1] || 'ogg'}`,
          mimeType || 'audio/ogg'
        )
        mediaUrl = result.signedUrl
        storagePath = result.storagePath
      } catch (error) {
        console.error('Failed to process audio:', error)
      }
    }
  } else if (messageData.message?.documentMessage) {
    const doc = messageData.message.documentMessage
    messageType = 'document'
    fileName = doc.fileName
    caption = doc.caption
    messageContent = fileName || caption || '[Documento]'
    mimeType = doc.mimetype
    fileSize = doc.fileLength
    
    if (doc.url) {
      try {
        const result = await downloadAndUploadMedia(
          supabase,
          doc.url,
          account.user_id,
          fileName || `document_${Date.now()}.pdf`,
          mimeType || 'application/pdf'
        )
        mediaUrl = result.signedUrl
        storagePath = result.storagePath
      } catch (error) {
        console.error('Failed to process document:', error)
      }
    }
  }
  
  // Find or create contact
  let { data: waContact } = await supabase
    .from('wa_contacts')
    .select('*')
    .eq('account_id', account.id)
    .eq('wa_phone_e164', phoneE164)
    .maybeSingle()

  if (!waContact) {
    console.log('📝 Creating new contact for', phoneE164)
    
    const { data: newContact, error: contactError } = await supabase
      .from('wa_contacts')
      .insert({
        user_id: account.user_id,
        tenant_id: account.tenant_id,
        account_id: account.id,
        wa_phone_e164: phoneE164,
        wa_phone_formatted: phoneRaw,
        profile_name: messageData.pushName || phoneRaw,
        last_seen_at: new Date().toISOString(),
        opt_in_status: 'opted_in'
      })
      .select()
      .single()
    
    if (contactError) {
      console.error('Failed to create contact:', contactError)
      return
    }
    
    waContact = newContact

    // Try to link with existing contato
    const { data: existingContact } = await supabase
      .from('contatos_v2')
      .select('id')
      .eq('user_id', account.user_id)
      .or(`celular.eq.${phoneRaw},telefone.eq.${phoneRaw}`)
      .maybeSingle()

    if (existingContact) {
      await supabase
        .from('wa_contacts')
        .update({ contato_id: existingContact.id })
        .eq('id', waContact.id)
      
      console.log('🔗 Linked to existing contato:', existingContact.id)
    }
  }

  // Find or create thread
  let { data: thread } = await supabase
    .from('wa_atendimentos')
    .select('*')
    .eq('wa_contact_id', waContact.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!thread) {
    console.log('📝 Creating new thread')
    
    const { data: newThread, error: threadError } = await supabase
      .from('wa_atendimentos')
      .insert({
        user_id: account.user_id,
        tenant_id: account.tenant_id,
        account_id: account.id,
        wa_contact_id: waContact.id,
        status: 'active',
        assigned_to: account.user_id,
        responsavel_id: account.user_id,
        last_message_at: new Date().toISOString(),
        last_customer_message_at: isFromMe ? null : new Date().toISOString()
      })
      .select()
      .single()
    
    if (threadError) {
      console.error('Failed to create thread:', threadError)
      return
    }
    
    thread = newThread
  }

  // Build standardized content
  const content: any = {
    type: messageType,
    text: messageContent
  }

  if (mediaUrl) {
    content.media_url = mediaUrl
    content.storage_path = storagePath
    content.mime = mimeType
    content.file_name = fileName
    content.size = fileSize
    if (duration) content.duration = duration
    if (caption) content.caption = caption
  }

  // Don't store large raw data - only small metadata
  content.raw_meta = {
    wa_id: messageData.key.id,
    timestamp: messageData.messageTimestamp,
    pushName: messageData.pushName
  }

  // Insert message
  const { error: messageError } = await supabase
    .from('wa_messages')
    .insert({
      user_id: account.user_id,
      tenant_id: account.tenant_id,
      thread_id: thread.id,
      contato_id: waContact.contato_id,
      wa_message_id: messageData.key.id,
      direction: isFromMe ? 'OUTBOUND' : 'INBOUND',
      message_type: messageType,
      status: 'DELIVERED',
      content,
      timestamp: new Date(messageData.messageTimestamp * 1000).toISOString()
    })
  
  if (messageError) {
    console.error('Failed to insert message:', messageError)
    return
  }

  // Update thread
  const updateData: any = {
    updated_at: new Date().toISOString(),
    last_message_at: new Date().toISOString()
  }
  
  if (!isFromMe) {
    updateData.last_customer_message_at = new Date().toISOString()
  }
  
  await supabase
    .from('wa_atendimentos')
    .update(updateData)
    .eq('id', thread.id)

  // Log event
  await supabase.from('wa_events_log').insert({
    user_id: account.user_id,
    event_type: 'message_received',
    event_data: {
      type: messageType,
      has_media: !!mediaUrl,
      from_me: isFromMe
    }
  })

  // Audit log
  await supabase.from('security_audit_log').insert({
    user_id: account.user_id,
    event_type: 'wa_message_received',
    event_description: `WhatsApp message received (${messageType})`,
    metadata: {
      type: messageType,
      thread_id: thread.id
    }
  })

  console.log('🎉 Message processed successfully!')
}