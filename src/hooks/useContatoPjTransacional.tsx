import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DadosEmpresa } from '@/lib/cnpj';

export interface ContatoPjPayload {
  nome_fantasia: string;
  classificacao?: string;
  responsavel_id?: string;
  observacao?: string;
  dados_pj: {
    cnpj?: string;
    razao_social?: string;
    nome_fantasia?: string;
    natureza_juridica?: string;
    porte?: string;
    situacao_cadastral?: string;
    data_abertura?: string;
    capital_social?: number;
    cnae_principal?: string;
    cnaes_secundarios?: string[];
    matriz_filial?: string;
    regime_tributario?: string;
    situacao_motivo?: string;
    situacao_data?: string;
    municipio_ibge?: string;
    origem_dados?: string;
  };
  enderecos: Array<{
    tipo?: string;
    principal?: boolean;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    ibge?: string;
    latitude?: number;
    longitude?: number;
    origem_dados?: string;
  }>;
  meios_contato: Array<{
    tipo: 'Email' | 'Celular' | 'Telefone' | 'WhatsApp';
    valor: string;
    principal?: boolean;
    observacao?: string;
  }>;
}

export function useContatoPjTransacional() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const criarContatoPj = async (payload: ContatoPjPayload): Promise<string | null> => {
    setLoading(true);
    try {
      // Buscar empresa_id e filial_id do usuário
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id, filial_id')
        .eq('user_id', authUser?.id)
        .single();

      if (!userProfile?.empresa_id || !userProfile?.filial_id) {
        toast({
          title: 'Erro',
          description: 'Configuração SaaS incompleta. Entre em contato com o administrador.',
          variant: 'destructive',
        });
        return null;
      }

      // Verificar se CNPJ já existe
      if (payload.dados_pj.cnpj) {
        const cnpjLimpo = payload.dados_pj.cnpj.replace(/\D/g, '');
        const { data: existingContato } = await supabase
          .from('contato_pj')
          .select('contato_id, contatos_v2!inner(id, nome_fantasia)')
          .eq('cnpj', cnpjLimpo)
          .eq('tenant_id', authUser?.id)
          .maybeSingle();

        if (existingContato) {
          const contatoInfo = (existingContato as any).contatos_v2;
          toast({
            title: 'CNPJ já cadastrado',
            description: `Este CNPJ já está cadastrado para: ${contatoInfo.nome_fantasia}. Redirecionando para edição...`,
            variant: 'destructive',
          });
          // Retornar o ID do contato existente para que possa ser redirecionado
          return contatoInfo.id;
        }
      }

      const { data, error } = await supabase.rpc('criar_contato_pj_transacional', {
        p_nome_fantasia: payload.nome_fantasia,
        p_classificacao: payload.classificacao || 'cliente',
        p_responsavel_id: payload.responsavel_id || null,
        p_observacao: payload.observacao || null,
        p_dados_pj: {
          ...payload.dados_pj,
          empresa_id: userProfile.empresa_id,
          filial_id: userProfile.filial_id,
        } as any,
        p_enderecos: payload.enderecos as any,
        p_meios_contato: payload.meios_contato as any,
        // Desambiguação de overload: usa a versão completa da função
        p_contato_id: null,
        p_qsa: [],
      });

      if (error) {
        console.error('Erro ao criar contato PJ:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao criar contato',
          variant: 'destructive',
        });
        return null;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        toast({
          title: 'Sucesso',
          description: 'Contato criado com sucesso',
        });
        return (data as any).contato_id;
      }

      return null;
    } catch (error) {
      console.error('Erro ao criar contato PJ:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar contato',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const mapearDadosCnpjParaPayload = (
    dadosCnpj: DadosEmpresa,
    meiosContato: Array<{ tipo: string; valor: string; principal?: boolean }>
  ): ContatoPjPayload => {
    return {
      nome_fantasia: dadosCnpj.nome_fantasia || dadosCnpj.nome,
      classificacao: 'cliente',
      dados_pj: {
        cnpj: dadosCnpj.cpf_cnpj,
        razao_social: dadosCnpj.nome,
        nome_fantasia: dadosCnpj.nome_fantasia,
        natureza_juridica: dadosCnpj.natureza_juridica,
        porte: dadosCnpj.porte || dadosCnpj.porte_empresa,
        situacao_cadastral: dadosCnpj.situacao_cadastral,
        data_abertura: dadosCnpj.data_abertura,
        capital_social: dadosCnpj.capital_social,
        cnae_principal: dadosCnpj.cnae_principal,
        cnaes_secundarios: dadosCnpj.cnae_secundarias?.split(',').map(s => s.trim()),
        matriz_filial: dadosCnpj.identificador_matriz_filial,
        situacao_motivo: dadosCnpj.motivo_situacao_cadastral,
        situacao_data: dadosCnpj.data_situacao_cadastral,
        municipio_ibge: dadosCnpj.municipio_ibge,
        origem_dados: 'api_cnpj',
      },
      enderecos: dadosCnpj.endereco ? [{
        tipo: 'Comercial',
        principal: true,
        cep: dadosCnpj.cep,
        logradouro: dadosCnpj.endereco,
        numero: dadosCnpj.numero,
        complemento: dadosCnpj.complemento,
        bairro: dadosCnpj.bairro,
        cidade: dadosCnpj.cidade,
        uf: dadosCnpj.uf || dadosCnpj.estado,
        origem_dados: 'api_cnpj',
      }] : [],
      meios_contato: meiosContato as any,
    };
  };

  return {
    loading,
    criarContatoPj,
    mapearDadosCnpjParaPayload,
  };
}
