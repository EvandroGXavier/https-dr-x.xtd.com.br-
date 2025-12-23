// 🔄 ERP-LOVABLE — Renovar URLs assinadas de mídia WhatsApp
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
    const { message_id, storage_path } = await req.json()
    
    if (!message_id && !storage_path) {
      return new Response(JSON.stringify({ error: 'Missing message_id or storage_path' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔄 Refreshing media URL for:', { message_id, storage_path })

    let pathToRefresh = storage_path

    // Se só temos message_id, buscar o storage_path
    if (message_id && !storage_path) {
      const { data: msgData, error: msgError } = await supabase
        .from('wa_messages')
        .select('content')
        .eq('id', message_id)
        .eq('user_id', user.id)
        .single()

      if (msgError || !msgData) {
        return new Response(JSON.stringify({ error: 'Message not found' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      pathToRefresh = msgData.content?.storage_path
      
      if (!pathToRefresh) {
        return new Response(JSON.stringify({ 
          error: 'No storage_path in message content',
          details: 'Message does not have media or was created before storage_path feature'
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    console.log('📂 Generating signed URL for path:', pathToRefresh)

    // Gerar nova URL assinada (1 hora)
    const { data: signedData, error: signError } = await supabase.storage
      .from('wa-midia')
      .createSignedUrl(pathToRefresh, 3600)

    if (signError) {
      console.error('❌ Signed URL error:', signError)
      return new Response(JSON.stringify({ 
        error: 'Failed to create signed URL',
        details: signError.message
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const newMediaUrl = signedData.signedUrl
    console.log('✅ New signed URL created')

    // Se temos message_id, atualizar o registro
    if (message_id) {
      const { error: updateError } = await supabase
        .from('wa_messages')
        .update({
          content: supabase.rpc('jsonb_set', {
            target: 'content',
            path: '{media_url}',
            new_value: JSON.stringify(newMediaUrl)
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', message_id)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('⚠️ Failed to update message:', updateError)
        // Não falhar a request, apenas logar
      } else {
        console.log('💾 Message updated with new URL')
      }
    }

    // Log de auditoria
    await supabase.from('security_audit_log').insert({
      user_id: user.id,
      event_type: 'whatsapp_media_url_refreshed',
      event_description: 'Refreshed signed URL for WhatsApp media',
      metadata: {
        message_id,
        storage_path: pathToRefresh
      }
    })

    return new Response(JSON.stringify({ 
      ok: true,
      media_url: newMediaUrl,
      storage_path: pathToRefresh,
      expires_in_seconds: 3600
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Refresh media URL error:', error)
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
