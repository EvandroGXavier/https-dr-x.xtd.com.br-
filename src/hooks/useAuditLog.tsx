import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogEntry {
  actor: string;
  action: string;
  target_id: string;
  module: string;
  tenant_id?: string;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = useCallback(async (entry: Omit<AuditLogEntry, 'actor' | 'tenant_id'>) => {
    if (!user) return;

    try {
      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        event_type: entry.action,
        event_description: `${entry.action} in ${entry.module} - Target: ${entry.target_id}`,
        metadata: {
          module: entry.module,
          target_id: entry.target_id,
          ...entry.metadata
        }
      });
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error);
    }
  }, [user]);

  const logProcessoAction = useCallback(async (action: string, processoId: string, metadata?: Record<string, any>) => {
    await logAction({
      action,
      target_id: processoId,
      module: 'processos',
      metadata
    });
  }, [logAction]);

  const logParteAction = useCallback(async (action: string, parteId: string, processoId: string, metadata?: Record<string, any>) => {
    await logAction({
      action,
      target_id: parteId,
      module: 'processo_partes',
      metadata: {
        processo_id: processoId,
        ...metadata
      }
    });
  }, [logAction]);

  const logHonorarioAction = useCallback(async (action: string, honorarioId: string, processoId: string, metadata?: Record<string, any>) => {
    await logAction({
      action,
      target_id: honorarioId,
      module: 'processo_honorarios',
      metadata: {
        processo_id: processoId,
        ...metadata
      }
    });
  }, [logAction]);

  const logDocumentoAction = useCallback(async (action: string, documentoId: string, metadata?: Record<string, any>) => {
    await logAction({
      action,
      target_id: documentoId,
      module: 'documentos',
      metadata
    });
  }, [logAction]);

  return {
    logAction,
    logProcessoAction,
    logParteAction,
    logHonorarioAction,
    logDocumentoAction
  };
};