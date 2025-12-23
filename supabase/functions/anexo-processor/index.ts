import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log("🔒 [Security Hardened] Anexo Processor Function Up!")

serve(async (req) => {
  // 1. Tratamento de CORS (Pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Capturar e Validar Contexto do Usuário (Auth)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Cliente para autenticação (contexto do usuário)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar usuário logado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Usuário não autenticado")

    // 3. Payload da Requisição
    const { 
      storagePath, 
      fileName, 
      processoId, 
      action = 'ocr' // ocr | summarize | classify
    } = await req.json()

    if (!processoId || !storagePath) {
      throw new Error("Parâmetros obrigatórios: processoId e storagePath")
    }

    // 4. Cliente Admin para operações privilegiadas (após validação)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ========================================================================
    // 🛡️ SECURITY CHECKPOINT: Validação de Isolamento Multi-Tenant
    // ========================================================================
    
    // A. Buscar Tenant do Usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.empresa_id) {
      throw new Error("Perfil de usuário ou empresa não encontrados (Tenant Check Failed)")
    }

    // B. Buscar Tenant do Recurso Alvo (Processo)
    const { data: processo, error: processoError } = await supabaseAdmin
      .from('processos')
      .select('tenant_id, id')
      .eq('id', processoId)
      .single()

    if (processoError || !processo) {
      throw new Error("Processo não encontrado")
    }

    // C. Validação Cruzada (User Tenant === Resource Tenant)
    if (profile.empresa_id !== processo.tenant_id) {
      console.error(`🚨 ALERTA DE SEGURANÇA: Tentativa de acesso cruzado. User: ${user.id}, Target: ${processoId}`)
      return new Response(
        JSON.stringify({ error: "Acesso Negado: Violação de Isolamento de Tenant" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Acesso validado para Tenant: ${profile.empresa_id}`)
    // ========================================================================

    // 5. Lógica de Processamento (OCR / IA)
    // Aqui inserimos a lógica real de processamento, agora segura.
    
    // Simulação de processamento (Substituir pela lógica real de IA/OCR)
    const processingResult = {
      success: true,
      file: fileName,
      action_performed: action,
      extracted_text: "Conteúdo simulado extraído com segurança...",
      metadata: {
        pages: 1,
        confidence: 0.98
      },
      processed_at: new Date().toISOString()
    }

    // 6. Auditoria (Opcional mas recomendado)
    await supabaseAdmin.from('security_audit_log').insert({
      action: `process_anexo_${action}`,
      entity: 'processos',
      entity_id: processoId,
      user_id: user.id,
      tenant_id: profile.empresa_id,
      details: { file: fileName, storage: storagePath, status: 'success' }
    })

    return new Response(
      JSON.stringify(processingResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Erro no processamento:", error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})