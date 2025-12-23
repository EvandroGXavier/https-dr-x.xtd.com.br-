import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedSecurityOptions {
  enableRiskScoring?: boolean;
  enableAutoLockdown?: boolean;
  enableDataExportLimits?: boolean;
}

interface SecurityOperationOptions {
  operation: string;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export function useEnhancedSecurity(options: EnhancedSecurityOptions = {}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Enhanced security event logging
  const logSecurityEvent = useCallback(async (
    eventType: string,
    description: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low',
    metadata?: Record<string, any>
  ) => {
    try {
      const { error } = await supabase.rpc('log_enhanced_security_event', {
        event_type: eventType,
        event_description: description,
        risk_level: riskLevel,
        metadata: metadata || {}
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  // Monitor data export with enhanced controls
  const checkDataExportPermission = useCallback(async (
    exportType: string,
    recordCount: number,
    tableNames: string[]
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('monitor_data_export', {
        export_type: exportType,
        record_count: recordCount,
        table_names: tableNames
      });

      if (error) throw error;

      const result = data as any;
      
      if (!result.allowed) {
        toast({
          title: "Export Bloqueado",
          description: result.message || "Limite de exportação excedido",
          variant: "destructive"
        });
        return false;
      }

      // Log successful export authorization
      await logSecurityEvent(
        'data_export_authorized',
        `Export autorizado: ${recordCount} registros de ${tableNames.join(', ')}`,
        recordCount > 100 ? 'medium' : 'low',
        {
          export_type: exportType,
          record_count: recordCount,
          table_names: tableNames,
          remaining_exports: result.remaining_exports
        }
      );

      return true;
    } catch (error) {
      console.error('Error checking export permission:', error);
      toast({
        title: "Erro de Segurança",
        description: "Falha ao verificar permissões de exportação",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [logSecurityEvent, toast]);

  // Monitor WhatsApp token access
  const monitorWhatsAppTokenAccess = useCallback(async (
    accountId: string,
    operationType: 'encrypt' | 'decrypt' | 'access' | 'rotation'
  ) => {
    try {
      const { error } = await supabase.rpc('monitor_whatsapp_token_access', {
        account_id: accountId,
        operation_type: operationType
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to monitor WhatsApp token access:', error);
    }
  }, []);

  // Enhanced webhook signature validation
  const validateWebhookSignature = useCallback(async (
    payload: string,
    signature: string,
    appSecret: string,
    webhookSource: string = 'whatsapp'
  ) => {
    try {
      const { data, error } = await supabase.rpc('validate_webhook_signature_enhanced', {
        payload,
        signature,
        app_secret: appSecret,
        webhook_source: webhookSource
      });

      if (error) throw error;

      const result = data as any;
      return result.valid;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }, []);

  // Secure contact access with enhanced monitoring
  const getContactsSecure = useCallback(async (
    limit: number = 50,
    offset: number = 0,
    exportPurpose: 'view' | 'export' = 'view'
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_contacts_secure_enhanced', {
        limit_count: limit,
        offset_count: offset,
        export_purpose: exportPurpose
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error accessing contacts securely:', error);
      
      // Check if it's an export limit error
      if (error.message?.includes('Export limit exceeded')) {
        toast({
          title: "Limite de Export Excedido",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro de Acesso",
          description: "Falha ao acessar contatos de forma segura",
          variant: "destructive"
        });
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Emergency admin access (admin only)
  const requestEmergencyAccess = useCallback(async (
    targetTable: string,
    emergencyReason: string,
    justification: string
  ) => {
    try {
      const { data, error } = await supabase.rpc('emergency_admin_access', {
        target_table: targetTable,
        emergency_reason: emergencyReason,
        justification
      });

      if (error) throw error;

      const result = data as any;
      
      if (result.access_granted) {
        toast({
          title: "Acesso de Emergência Concedido",
          description: `Acesso autorizado para ${targetTable}. Auditoria obrigatória.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Acesso Negado",
          description: "Não há permissão para acesso de emergência",
          variant: "destructive"
        });
      }

      return result.access_granted;
    } catch (error) {
      console.error('Error requesting emergency access:', error);
      toast({
        title: "Erro",
        description: "Falha ao solicitar acesso de emergência",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Apply data retention policies
  const applyDataRetentionPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('apply_data_retention_policies');
      
      if (error) throw error;

      toast({
        title: "Políticas Aplicadas",
        description: "Políticas de retenção de dados executadas com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Error applying retention policies:', error);
      toast({
        title: "Erro",
        description: "Falha ao aplicar políticas de retenção",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    logSecurityEvent,
    checkDataExportPermission,
    monitorWhatsAppTokenAccess,
    validateWebhookSignature,
    getContactsSecure,
    requestEmergencyAccess,
    applyDataRetentionPolicies
  };
}