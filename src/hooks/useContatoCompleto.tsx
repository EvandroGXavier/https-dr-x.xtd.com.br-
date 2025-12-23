import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { setServerContext } from '@/lib/supabase/rpc';

export interface MeioContatoDTO {
  tipo: string;
  valor: string;
  principal?: boolean;
}

export interface EnderecoDTO {
  tipo: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  principal?: boolean;
}

export interface CreateContatoDTO {
  nome: string;
  cpf_cnpj?: string;
  observacao?: string;
  meios_contato?: MeioContatoDTO[];
  enderecos?: EnderecoDTO[];
  dados_pf?: any;
  dados_pj?: any;
  empresa_id?: string;
  filial_id?: string;
}

export interface UpdateContatoDTO extends Partial<CreateContatoDTO> {
  id: string;
}

export interface ContatoCompletoResponse {
  id: string;
  nome_fantasia: string;
  cpf_cnpj?: string;
  observacao?: string;
  // tipo_pessoa calculado automaticamente: 11 dígitos=PF, 14=PJ, vazio=Lead
  meios_contato: MeioContatoDTO[];
  enderecos: EnderecoDTO[];
  dados_pf?: any;
  dados_pj?: any;
  empresa_id?: string;
  filial_id?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export function useContatoCompleto() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createContato = async (data: CreateContatoDTO): Promise<ContatoCompletoResponse | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      // Chamar RPC transacional (tipo calculado automaticamente baseado no cpf_cnpj)
      const { data: result, error } = await supabase.rpc('upsert_contato_v2_transacional', {
        p_contato_id: null, // null = criar novo
        p_nome: data.nome,
        p_cpf_cnpj: data.cpf_cnpj || null,
        p_observacao: data.observacao || null,
        p_meios_contato: (data.meios_contato || []) as any,
        p_enderecos: (data.enderecos || []) as any,
        p_dados_pf: (data.dados_pf || null) as any,
        p_dados_pj: (data.dados_pj || null) as any,
        p_etiquetas: [] as any,
      });

      if (error) throw error;

      const resultData = result as any;
      const createdId = resultData?.id;

      if (createdId) {
        toast({
          title: "Sucesso",
          description: resultData?.message || "Contato criado com sucesso",
        });

        // Buscar o contato completo para manter compatibilidade do retorno
        return await readContato(createdId);
      }

      throw new Error(resultData?.message || 'Erro ao criar contato');
    } catch (error: any) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar contato",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const readContato = async (id: string): Promise<ContatoCompletoResponse | null> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      // Buscar contexto do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id, filial_id')
        .eq('user_id', authUser?.id)
        .single();

      if (!userProfile?.empresa_id) {
        throw new Error('Configuração de empresa não encontrada');
      }

      // Configurar contexto no servidor
      await setServerContext(supabase, userProfile.empresa_id, userProfile.filial_id);

      const { data: result, error } = await supabase.rpc('fn_ler_contato_completo' as any, {
        p_empresa_id: userProfile.empresa_id,
        p_filial_id: userProfile.filial_id,
        p_contato_id: id,
      });

      if (error) throw error;

      return result as any as ContatoCompletoResponse;
    } catch (error: any) {
      console.error('Erro ao buscar contato:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar contato",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateContato = async (data: UpdateContatoDTO): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Chamar RPC transacional (tipo calculado automaticamente)
      const { data: result, error } = await supabase.rpc('upsert_contato_v2_transacional', {
        p_contato_id: data.id,
        p_nome: data.nome || null,
        p_cpf_cnpj: data.cpf_cnpj || null,
        p_observacao: data.observacao || null,
        p_meios_contato: (data.meios_contato || []) as any,
        p_enderecos: (data.enderecos || []) as any,
        p_dados_pf: (data.dados_pf || null) as any,
        p_dados_pj: (data.dados_pj || null) as any,
        p_etiquetas: [] as any,
      });

      if (error) throw error;

      const resultData = result as any;
      if (resultData?.success === true) {
        toast({
          title: "Sucesso",
          description: resultData?.message || "Contato atualizado com sucesso",
        });
        return true;
      }

      throw new Error(resultData?.message || 'Erro ao atualizar contato');
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar contato",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteContato = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      // Buscar contexto do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id, filial_id')
        .eq('user_id', authUser?.id)
        .single();

      if (!userProfile?.empresa_id) {
        throw new Error('Configuração de empresa não encontrada');
      }

      // Configurar contexto no servidor
      await setServerContext(supabase, userProfile.empresa_id, userProfile.filial_id);

      const { data: result, error } = await supabase.rpc('fn_excluir_contato_logico' as any, {
        p_empresa_id: userProfile.empresa_id,
        p_filial_id: userProfile.filial_id,
        p_contato_id: id,
      });

      if (error) throw error;

      const resultData = result as any;
      if (resultData === true || (typeof resultData === 'object' && resultData?.success === true)) {
        toast({
          title: "Sucesso",
          description: "Contato excluído com sucesso",
        });
        return true;
      }

      throw new Error((resultData && resultData.message) || 'Erro ao excluir contato');
    } catch (error: any) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir contato",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createContato,
    readContato,
    updateContato,
    deleteContato,
  };
}
