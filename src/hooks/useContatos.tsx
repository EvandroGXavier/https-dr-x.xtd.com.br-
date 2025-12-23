import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * @deprecated Este hook está DEPRECADO. Use `useContatosV2` para operações CRUD.
 * 
 * Este hook permanece apenas para compatibilidade de leitura em componentes antigos.
 * NÃO use createContact/updateContact/deleteContact - eles não respeitam o modelo multi-tenant correto.
 * 
 * Para criar/editar/excluir contatos, use:
 * - `useContatosV2().createContactTransactional()` 
 * - `useContatosV2().updateContact()`
 * - `useContatosV2().deleteContact()` (usa RPC seguro)
 */

export interface Contact {
  id: string;
  nome_fantasia: string;
  email?: string | null;
  telefone?: string | null;
  celular: string;
  cpf_cnpj?: string | null;
  observacao?: string | null;
  ativo?: boolean; // Opcional pois view de compatibilidade pode não ter
  created_at: string;
  updated_at: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  user_id: string;
  tipo_pessoa?: string | null;
}

export function useContatos() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Carrega contatos da view de compatibilidade (SOMENTE LEITURA)
   */
  const loadContacts = async () => {
    setLoading(true);
    try {
      // Usar view de compatibilidade para leitura apenas
      const { data, error } = await supabase
        .from('vw_contatos_compat')
        .select('*')
        .order('nome_fantasia');

      if (error) {
        console.error('Erro ao carregar contatos:', error);
        throw error;
      }
      
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

  /**
   * @deprecated NÃO USE. Use `useContatosV2().createContactTransactional()` ou `useContatoCompleto().createContato()`
   */
  const createContact = async (contactData: any) => {
    console.warn('useContatos.createContact() está deprecado. Use useContatosV2 ou useContatoCompleto.');
    throw new Error('createContact() deprecado. Use useContatosV2().createContactTransactional()');
  };

  /**
   * @deprecated NÃO USE. Use `useContatosV2().updateContact()`
   */
  const updateContact = async (id: string, contactData: Partial<Contact>) => {
    console.warn('useContatos.updateContact() está deprecado. Use useContatosV2.updateContact().');
    throw new Error('updateContact() deprecado. Use useContatosV2().updateContact()');
  };

  /**
   * @deprecated NÃO USE. Use `useContatosV2().deleteContact()`
   */
  const deleteContact = async (id: string) => {
    console.warn('useContatos.deleteContact() está deprecado. Use useContatosV2.deleteContact().');
    throw new Error('deleteContact() deprecado. Use useContatosV2().deleteContact()');
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    loadContacts,
    createContact, // Mantido por compatibilidade mas lança erro
    updateContact, // Mantido por compatibilidade mas lança erro
    deleteContact  // Mantido por compatibilidade mas lança erro
  };
}