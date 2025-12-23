import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Sem autorização' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verificar se é superadmin OU admin
    const { data: isSuperAdmin } = await supabase
      .from('saas_superadmins')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    // Verificar se tem role admin usando a função has_role
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      })

    if (!isSuperAdmin && !isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Acesso negado. Apenas Administradores podem executar limpeza de storage.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, keepBackups = 5, daysOldMedia = 90, cleanAuditLogs = false, deleteAllMedia = false } = await req.json()
    
    const results: any = {
      backups_deleted: 0,
      media_deleted: 0,
      audit_logs_deleted: 0,
      space_freed: 0
    }

    // 1. Limpar backups antigos (manter apenas os N mais recentes)
    if (action === 'backups' || action === 'all') {
      console.log(`Limpando backups antigos, mantendo apenas os ${keepBackups} mais recentes...`)
      
      // Buscar todos os backups ordenados por data
      const { data: allBackups } = await supabase.storage
        .from('system-backups')
        .list()

      if (allBackups && allBackups.length > keepBackups) {
        // Ordenar por data de criação (mais recente primeiro)
        const sortedBackups = allBackups
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        // Pegar os que devem ser deletados (depois dos N mais recentes)
        const backupsToDelete = sortedBackups.slice(keepBackups)
        
        for (const backup of backupsToDelete) {
          const { error } = await supabase.storage
            .from('system-backups')
            .remove([backup.name])
          
          if (!error) {
            results.backups_deleted++
            results.space_freed += backup.metadata?.size || 0
          }
        }

        // Limpar registros órfãos na tabela backup_history
        await supabase
          .from('backup_history')
          .delete()
          .not('file_path', 'in', `(${sortedBackups.slice(0, keepBackups).map(b => `'${b.name}'`).join(',')})`)
      }
    }

    // 2. Limpar mídias do WhatsApp
    if (action === 'media' || action === 'all') {
      console.log(deleteAllMedia ? 'Deletando TODAS as mídias do wa-midia...' : `Limpando mídias com mais de ${daysOldMedia} dias...`)
      
      const { data: allMedia } = await supabase.storage
        .from('wa-midia')
        .list('', {
          sortBy: { column: 'created_at', order: 'asc' }
        })

      if (allMedia) {
        let mediaToDelete = allMedia
        
        // Se não for para deletar tudo, filtra por data
        if (!deleteAllMedia) {
          const cutoffDate = new Date()
          cutoffDate.setDate(cutoffDate.getDate() - daysOldMedia)
          mediaToDelete = allMedia.filter(file => 
            new Date(file.created_at) < cutoffDate
          )
        }

        console.log(`Total de arquivos a deletar: ${mediaToDelete.length}`)

        // Deletar em lotes de 100
        for (let i = 0; i < mediaToDelete.length; i += 100) {
          const batch = mediaToDelete.slice(i, i + 100)
          const { error } = await supabase.storage
            .from('wa-midia')
            .remove(batch.map(f => f.name))
          
          if (!error) {
            results.media_deleted += batch.length
            results.space_freed += batch.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
            console.log(`Deletados ${results.media_deleted} de ${mediaToDelete.length} arquivos...`)
          } else {
            console.error('Erro ao deletar batch:', error)
          }
        }
      }
    }

    // 3. Limpar logs de auditoria antigos
    if (cleanAuditLogs && (action === 'logs' || action === 'all')) {
      console.log('Limpando logs de auditoria com mais de 90 dias...')
      
      const { data: deletedLogs } = await supabase
        .from('security_audit_log')
        .delete()
        .lt('timestamp', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .select('id')

      results.audit_logs_deleted = deletedLogs?.length || 0
    }

    // Formatar espaço liberado
    const spaceMB = (results.space_freed / (1024 * 1024)).toFixed(2)
    const spaceGB = (results.space_freed / (1024 * 1024 * 1024)).toFixed(2)

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        space_freed_mb: spaceMB,
        space_freed_gb: spaceGB,
        message: `Limpeza concluída! ${spaceMB} MB liberados.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Erro na limpeza:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})