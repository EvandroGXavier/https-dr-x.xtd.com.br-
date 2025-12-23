import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Define o contexto de sessão (tenant/filial) no servidor
 * para ser usado pelas políticas RLS
 */
export async function setServerContext(
  supabase: SupabaseClient, 
  empresaId: string | number | null, 
  filialId?: string | number | null
) {
  const { error } = await supabase.rpc('set_context_uuid', { 
    p_empresa: empresaId, 
    p_filial: filialId ?? null 
  });
  
  if (error) {
    console.error('Erro ao definir contexto:', error);
    throw error;
  }
}

/**
 * Limpa o contexto de sessão
 */
export async function clearServerContext(supabase: SupabaseClient) {
  // Limpar configurações de sessão
  const { error } = await supabase.rpc('set_context_uuid', { 
    p_empresa: null, 
    p_filial: null 
  });
  
  if (error) {
    console.error('Erro ao limpar contexto:', error);
  }
}