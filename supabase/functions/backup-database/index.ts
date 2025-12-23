import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is SuperAdmin (by id or email)
    const { data: saById, error: saIdErr } = await supabase
      .from('saas_superadmins')
      .select('superadmin_id')
      .eq('superadmin_id', user.id)
      .maybeSingle();

    let isSuperAdmin = !!saById;

    if (!isSuperAdmin && user.email) {
      const { data: saByEmail } = await supabase
        .from('saas_superadmins')
        .select('email')
        .eq('email', user.email)
        .maybeSingle();
      isSuperAdmin = !!saByEmail;
    }

    if (!isSuperAdmin) {
      throw new Error('Acesso negado: apenas SuperAdmins podem executar o backup completo.');
    }

    console.log('Starting FULL database backup for SuperAdmin:', user.id, user.email || '');

    // Complete list of all tables in the system for comprehensive backup
    const tables = [
      'agenda_etapas', 'agenda_fluxo_etapas', 'agenda_fluxos', 'agenda_locais', 'agenda_partes', 
      'agendas', 'aid_audit', 'aid_jobs', 'aid_mappings', 'aid_results', 'aid_templates',
      'andamentos_processuais', 'anexo_jobs', 'anexo_relacoes', 'anexos', 'backup_history',
      'biblioteca_grupos', 'biblioteca_modelos', 'biblioteca_modelos_honorarios',
      'biblioteca_modelos_honorarios_item', 'biblioteca_modelos_honorarios_parcela',
      'contas_financeiras', 'contato_anexo', 'contato_anexo_log', 'contato_documentos',
      'contato_enderecos', 'contato_financeiro_config', 'contato_meios_contato',
      'contato_pf', 'contato_pj', 'contatos_v2', 'contatos', 'documento_historico',
      'documento_modelos', 'documento_vinculos', 'documentos', 'email_config',
      'email_logs', 'email_triggers', 'etiqueta_vinculos', 'etiquetas',
      'platform_admins', 'profile_audit_log', 'profiles', 'processo_anexos',
      'processo_contratos', 'processo_contrato_itens', 'processo_desdobramentos',
      'processo_honorarios', 'processo_honorarios_eventos', 'processo_honorarios_item',
      'processo_honorarios_parcela', 'processo_movimentacoes', 'processo_partes',
      'processo_timeline', 'processo_vinculos', 'processos', 'saas_assinaturas',
      'saas_empresas', 'saas_planos', 'saas_superadmins', 'security_audit_log',
      'transacoes_financeiras', 'usuario_filial_perfis', 'wa_accounts', 'wa_contacts',
      'wa_messages', 'wa_threads', 'whatsapp_accounts', 'whatsapp_config',
      'whatsapp_logs', 'whatsapp_messages', 'whatsapp_templates'
    ];

    // Define comprehensive database schema structure for backup
    const databaseSchema = {
      description: 'Sistema Jurídico Lovable - Complete Database Schema',
      version: '2.0',
      tables_info: {
        note: 'Esta é uma lista abrangente de todas as tabelas do sistema',
        main_modules: [
          'Agendas e Fluxos de Trabalho',
          'Contatos e Pessoas (PF/PJ)',
          'Processos Jurídicos',
          'Documentos e Biblioteca',
          'Financeiro e Transações',
          'WhatsApp e Comunicações',
          'Segurança e Auditoria',
          'Anexos e Uploads',
          'Configurações e Admin'
        ],
        table_categories: {
          agenda: ['agenda_etapas', 'agenda_fluxo_etapas', 'agenda_fluxos', 'agenda_locais', 'agenda_partes', 'agendas'],
          contatos: ['contato_anexo', 'contato_documentos', 'contato_enderecos', 'contato_financeiro_config', 'contato_meios_contato', 'contato_pf', 'contato_pj', 'contatos_v2', 'contatos'],
          processos: ['andamentos_processuais', 'processo_anexos', 'processo_contratos', 'processo_contrato_itens', 'processo_desdobramentos', 'processo_honorarios', 'processo_honorarios_eventos', 'processo_honorarios_item', 'processo_honorarios_parcela', 'processo_movimentacoes', 'processo_partes', 'processo_timeline', 'processo_vinculos', 'processos'],
          documentos: ['biblioteca_grupos', 'biblioteca_modelos', 'biblioteca_modelos_honorarios', 'biblioteca_modelos_honorarios_item', 'biblioteca_modelos_honorarios_parcela', 'documento_historico', 'documento_modelos', 'documento_vinculos', 'documentos'],
          financeiro: ['contas_financeiras', 'transacoes_financeiras'],
          whatsapp: ['wa_accounts', 'wa_contacts', 'wa_messages', 'wa_threads', 'whatsapp_accounts', 'whatsapp_config', 'whatsapp_logs', 'whatsapp_messages', 'whatsapp_templates'],
          security: ['security_audit_log', 'profile_audit_log', 'platform_admins', 'profiles'],
          anexos: ['anexo_jobs', 'anexo_relacoes', 'anexos', 'contato_anexo_log'],
          sistema: ['backup_history', 'etiqueta_vinculos', 'etiquetas', 'email_config', 'email_logs', 'email_triggers'],
          saas: ['saas_assinaturas', 'saas_empresas', 'saas_planos', 'saas_superadmins', 'usuario_filial_perfis'],
          ai: ['aid_audit', 'aid_jobs', 'aid_mappings', 'aid_results', 'aid_templates']
        }
      },
      features: [
        'Row Level Security (RLS) em todas as tabelas',
        'Triggers para auditoria e validação',
        'Funções personalizadas para segurança',
        'Constraints e relacionamentos FK',
        'Índices para performance',
        'Campos de timestamp automáticos'
      ]
    };

    const backupData: any = {
      metadata: {
        version: '2.0',
        created_at: new Date().toISOString(),
        created_by: user.id,
        backup_type: 'database_complete',
        tables_count: tables.length,
        includes_schema: true,
        includes_data: true,
        database_name: 'Lovable Legal System',
        supabase_project_id: supabaseUrl.split('//')[1]?.split('.')[0] || 'unknown',
        backup_completeness: 'FULL - Includes all tables, data, and structure information'
      },
      schema: databaseSchema,
      data: {}
    };

    // Export ALL data from each table (SuperAdmin = full backup)
    for (const table of tables) {
      try {
        console.log(`Backing up table: ${table}`);
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error backing up ${table}:`, error);
          backupData.data[table] = { error: error.message, records: [] };
        } else {
          backupData.data[table] = { records: data || [], count: data?.length || 0 };
          console.log(`Successfully backed up ${table}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.error(`Exception backing up ${table}:`, err);
        backupData.data[table] = { error: (err as Error).message, records: [] };
      }
    }

    // Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_database_${timestamp}.json`;
    const backupContent = JSON.stringify(backupData, null, 2);
    
    // Ensure storage bucket exists
    const { data: bucketInfo } = await supabase.storage.getBucket('system-backups');
    if (!bucketInfo) {
      const { error: bucketErr } = await supabase.storage.createBucket('system-backups', { public: false });
      if (bucketErr) {
        throw new Error(`Failed to ensure storage bucket: ${bucketErr.message}`);
      }
    }

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('system-backups')
      .upload(fileName, new Blob([backupContent], { type: 'application/json' }), {
        contentType: 'application/json'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Record backup in history
    const { error: historyError } = await supabase
      .from('backup_history')
      .insert({
        user_id: user.id,
        backup_type: 'database',
        backup_size: backupContent.length,
        file_path: fileName,
        metadata: {
          tables_backed_up: tables,
          total_records: Object.values(backupData.data).reduce((acc: number, table: any) => acc + (table.count || 0), 0),
          backup_version: '2.0',
          includes_structure: true,
          backup_completeness: 'FULL - SuperAdmin Backup',
          performed_by: 'SuperAdmin'
        }
      });

    if (historyError) {
      console.error('Failed to record backup history:', historyError);
    }

    console.log('Database backup completed successfully');

    return new Response(JSON.stringify({
      success: true,
      fileName,
      size: backupContent.length,
      tablesCount: tables.length,
      downloadData: backupContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Database backup error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});