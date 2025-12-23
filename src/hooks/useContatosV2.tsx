import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FEATURES } from '@/config/features';

export interface ContatoV2 {
  id: string;
  nome_fantasia: string;
  cpf_cnpj?: string | null;
  observacao?: string | null;
  classificacao?: string | null;
  responsavel_id?: string | null;
  created_at: string;
  updated_at: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  user_id: string;
  tenant_id: string;
  tipo_pessoa?: string | null;
  pessoa_tipo?: string | null;
}

export function useContatosV2() {
  const [contacts, setContacts] = useState<ContatoV2[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadContacts = async () => {
    setLoading(true);
    try {
      let query;
      
      if (FEATURES.CONTATOS_V2_MIGRATION) {
        // Preferir contatos_v2 direto, fallback para VIEW contatos
        const { data: v2Data, error: v2Error } = await supabase
          .from('contatos_v2')
          .select('*')
          .order('nome_fantasia');

        if (!v2Error && v2Data) {
          setContacts(v2Data);
          return;
        }

        // Log error - no fallback view exists
        console.error('Erro ao carregar contatos_v2:', v2Error);
        throw v2Error;
      } else {
        // Usar contatos_v2 diretamente
        query = supabase
          .from('contatos_v2')
          .select('*')
          .order('nome_fantasia');
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContactTransactional = async (contactData: {
    nome_principal: string;
    classificacao?: string;
    empresa_id?: string;
    filial_id?: string;
    responsavel_id?: string;
    tipo_pessoa?: string;
    pessoa_tipo?: string;
    observacao?: string;
    meios_contato?: Array<{
      tipo: string;
      valor: string;
      is_principal: boolean;
    }>;
  }) => {
    try {
      const { data, error } = await supabase.rpc('criar_contato_transacional', {
        p_nome_principal: contactData.nome_principal,
        p_classificacao: contactData.classificacao || null,
        p_empresa_id: contactData.empresa_id || null,
        p_filial_id: contactData.filial_id || null,
        p_responsavel_id: contactData.responsavel_id || null,
        p_tipo_pessoa: contactData.tipo_pessoa || 'lead',
        p_pessoa_tipo: contactData.pessoa_tipo || 'cliente',
        p_observacao: contactData.observacao || null,
        p_meios_contato: contactData.meios_contato ? JSON.stringify(contactData.meios_contato) : '[]',
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: (data && typeof data === 'object' && 'message' in data ? (data as any).message : null) || "Contato criado com sucesso",
      });
      
      await loadContacts();
      return data;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contato",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Atualiza contato filtrando campos sensíveis (tenant_id, empresa_id, user_id não podem ser alterados)
   */
  const updateContact = async (id: string, contactData: Partial<ContatoV2>) => {
    try {
      // Filtrar campos que NÃO podem ser alterados via update direto
      const { tenant_id, empresa_id, filial_id, user_id, created_at, ...safeFields } = contactData;

      const { data, error } = await supabase
        .from('contatos_v2')
        .update(safeFields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso",
      });

      await loadContacts();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar contato",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Exclui contato de forma segura usando RPC com auditoria
   */
  const deleteContact = async (id: string) => {
    try {
      // @ts-ignore - RPC function type not yet in generated types
      const { data, error } = await supabase.rpc('excluir_contato_seguro', {
        p_contato_id: id
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato excluído com sucesso",
      });

      await loadContacts();
      return data;
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir contato",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    loadContacts,
    createContactTransactional,
    updateContact,
    deleteContact
  };
}