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
    const payload = await req.json()
    console.log('📥 Webhook received:', payload)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const eventType = payload.event
    const data = payload.data || {}
    const messageId = data.key?.id || data.id
    const timestamp = new Date((data.messageTimestamp || data.timestamp || Date.now()) * 1000).toISOString()

    // Process status update events
    if (eventType === 'messages.update' || eventType === 'message.update' || 
        eventType?.includes('status') || eventType?.includes('ack')) {
      
      const status = data.status || data.ack || 'SENT';
      const statusMap: { [key: string]: string } = {
        'PENDING': 'QUEUED',
        'SERVER': 'SENT',
        'DELIVERY_ACK': 'DELIVERED',
        'READ': 'READ',
        'PLAYED': 'READ',
        'ERROR': 'FAILED',
        '0': 'QUEUED',
        '1': 'SENT',
        '2': 'DELIVERED',
        '3': 'READ',
        '4': 'READ'
      };

      const finalStatus = statusMap[status.toUpperCase()] || status.toUpperCase();
      const update: any = { status: finalStatus };

      if (finalStatus === 'SENT') {
        update.sent_at = timestamp;
      } else if (finalStatus === 'DELIVERED') {
        update.delivered_at = timestamp;
      } else if (finalStatus === 'READ') {
        update.read_at = timestamp;
      } else if (finalStatus === 'FAILED') {
        update.error_message = data.error || data.message || 'Unknown error';
      }

      const { error: updateError } = await supabase
        .from('wa_messages')
        .update(update)
        .eq('wa_message_id', messageId);

      if (updateError) {
        console.error('❌ Failed to update message:', updateError);
        throw updateError;
      }

      console.log(`✅ Message ${messageId} updated to ${finalStatus}`);

      return new Response(
        JSON.stringify({ ok: true, message: `Status updated to ${finalStatus}` }), 
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process incoming messages  
    if (eventType === 'messages.upsert' || eventType === 'message.receive') {
      console.log('📥 Processing incoming message');
      
      // Extract sender phone
      const remoteJid = data.key?.remoteJid || data.from || data.chatId;
      if (!remoteJid) {
        console.error('❌ No remoteJid found');
        return new Response('Missing remoteJid', { status: 400, headers: corsHeaders });
      }

      const phone = remoteJid.replace('@s.whatsapp.net', '');
      
      // Get or create wa_contact
      let { data: waContact } = await supabase
        .from('wa_contacts')
        .select('id, contato_id, account_id')
        .eq('wa_phone_e164', phone)
        .maybeSingle();

      if (!waContact) {
        // Create contact in contatos_v2 first
        const { data: newContato } = await supabase
          .from('contatos_v2')
          .insert({ nome_fantasia: phone })
          .select('id')
          .single();

        if (!newContato) {
          console.error('❌ Failed to create contact');
          return new Response('Failed to create contact', { status: 500, headers: corsHeaders });
        }

        // Create wa_contact
        const { data: newWaContact } = await supabase
          .from('wa_contacts')
          .insert({
            wa_phone_e164: phone,
            contato_id: newContato.id,
            account_id: data.instance // Get from webhook payload
          })
          .select('id, contato_id, account_id')
          .single();

        waContact = newWaContact;
      }

      if (!waContact) {
        console.error('❌ Failed to get/create waContact');
        return new Response('Failed to get contact', { status: 500, headers: corsHeaders });
      }

      // Get or create thread
      let { data: thread } = await supabase
        .from('wa_atendimentos')
        .select('id')
        .eq('wa_contact_id', waContact.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!thread) {
        const { data: newThread } = await supabase
          .from('wa_atendimentos')
          .insert({
            wa_contact_id: waContact.id,
            account_id: waContact.account_id,
            status: 'pendente'
          })
          .select('id')
          .single();

        thread = newThread;
      }

      if (!thread) {
        console.error('❌ Failed to get/create thread');
        return new Response('Failed to get thread', { status: 500, headers: corsHeaders });
      }

      // Extract message content
      const messageData = data.message;
      let messageType = 'text';
      let content: any = { type: 'text' };

      if (messageData?.conversation || messageData?.extendedTextMessage) {
        messageType = 'text';
        content.text = messageData.conversation || messageData.extendedTextMessage?.text || '';
      } else if (messageData?.imageMessage) {
        messageType = 'image';
        content.media_url = messageData.imageMessage.url;
        content.mime = messageData.imageMessage.mimetype;
        content.caption = messageData.imageMessage.caption || '';
      } else if (messageData?.audioMessage) {
        messageType = 'audio';
        content.media_url = messageData.audioMessage.url;
        content.mime = messageData.audioMessage.mimetype;
        content.duration = messageData.audioMessage.seconds;
      } else if (messageData?.videoMessage) {
        messageType = 'video';
        content.media_url = messageData.videoMessage.url;
        content.mime = messageData.videoMessage.mimetype;
        content.caption = messageData.videoMessage.caption || '';
      } else if (messageData?.documentMessage) {
        messageType = 'document';
        content.media_url = messageData.documentMessage.url;
        content.mime = messageData.documentMessage.mimetype;
        content.file_name = messageData.documentMessage.fileName;
      }

      // Save message
      await supabase.from('wa_messages').insert({
        direction: 'INBOUND',
        message_type: messageType,
        status: 'DELIVERED',
        content,
        wa_message_id: messageId,
        thread_id: thread.id,
        contato_id: waContact.contato_id,
        timestamp
      });

      // Update thread
      await supabase.from('wa_atendimentos').update({
        last_message_at: timestamp
      }).eq('id', thread.id);

      console.log('✅ Incoming message processed');

      return new Response(
        JSON.stringify({ ok: true, message: 'Message received' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ignore other event types
    console.log(`ℹ️ Ignored event type: ${eventType}`)
    return new Response(
      JSON.stringify({ ok: true, message: 'Event ignored' }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Webhook error:', error)
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
