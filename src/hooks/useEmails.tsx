import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface EmailConta {
  id: string;
  empresa_id?: string;
  filial_id?: string;
  user_id: string;
  nome: string;
  email: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  tls_ssl: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTrigger {
  id: string;
  empresa_id?: string;
  filial_id?: string;
  user_id: string;
  nome: string;
  descricao?: string;
  modelo_id: string;
  conta_id: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  email_conta?: EmailConta;
  modelo?: any;
}

export interface EmailLog {
  id: string;
  trigger_id?: string;
  contato_id?: string;
  user_id: string;
  conta_id: string;
  destinatario_email: string;
  assunto: string;
  status: 'pendente' | 'enviado' | 'erro';
  mensagem_erro?: string;
  enviado_em?: string;
  tentativa: number;
  payload?: any;
  created_at: string;
  // Relacionamentos
  email_trigger?: EmailTrigger;
  contato?: any;
}

export function useEmails() {
  const [contas, setContas] = useState<EmailConta[]>([]);
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar contas de e-mail
  const loadContas = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_contas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setContas(data || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas de e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar triggers
  const loadTriggers = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_triggers')
        .select(`
          *,
          email_conta:email_contas(nome, email),
          modelo:biblioteca_modelos(titulo)
        `)
        .order('nome');

      if (error) throw error;
      setTriggers((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar triggers:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os gatilhos de e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs
  const loadLogs = async (filters?: { status?: string; startDate?: string; endDate?: string }) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('email_logs')
        .select(`
          *,
          email_trigger:email_triggers(nome),
          contato:contatos(nome, email)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status as any);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar conta de e-mail
  const createConta = async (contaData: Omit<EmailConta, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('email_contas')
        .insert([{
          ...contaData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta de e-mail criada com sucesso.",
      });

      await loadContas();
      return data;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta de e-mail.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Atualizar conta de e-mail
  const updateConta = async (id: string, contaData: Partial<EmailConta>) => {
    try {
      const { error } = await supabase
        .from('email_contas')
        .update(contaData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta de e-mail atualizada com sucesso.",
      });

      await loadContas();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta de e-mail.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Criar trigger
  const createTrigger = async (triggerData: Omit<EmailTrigger, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('email_triggers')
        .insert([{
          ...triggerData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Gatilho criado com sucesso.",
      });

      await loadTriggers();
      return data;
    } catch (error) {
      console.error('Erro ao criar trigger:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o gatilho.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Reenviar e-mail
  const reenviarEmail = async (logId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-email-retry', {
        body: { logId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "E-mail reenviado com sucesso.",
      });

      await loadLogs();
      return true;
    } catch (error) {
      console.error('Erro ao reenviar e-mail:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reenviar o e-mail.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Testar conta SMTP
  const testarConta = async (contaId: string) => {
    try {
      const { error } = await supabase.functions.invoke('test-smtp', {
        body: { contaId }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Teste de envio realizado com sucesso.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao testar SMTP:', error);
      toast({
        title: "Erro",
        description: "Falha no teste de envio. Verifique as configurações.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadContas();
      loadTriggers();
      loadLogs();
    }
  }, [user]);

  return {
    contas,
    triggers,
    logs,
    loading,
    loadContas,
    loadTriggers,
    loadLogs,
    createConta,
    updateConta,
    createTrigger,
    reenviarEmail,
    testarConta
  };
}