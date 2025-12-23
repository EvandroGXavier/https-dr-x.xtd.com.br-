import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EmpresaComAssinatura {
  empresa_uuid: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  plano: string;
  valor: number;
  dia_vencimento: number;
  status: string;
  status_normalizado: string;
  ativa: boolean;
  updated_at: string;
}

interface SaasPlano {
  plano_id: string;
  nome: string;
  descricao: string;
  valor_padrao: number;
  limite_usuarios: number;
  limite_filiais: number;
}

interface SaasAssinatura {
  assinatura_id: string;
  empresa_id: string;
  plano_id: string;
  valor_mensal: number;
  dia_vencimento: number;
  status: string;
  trial_until: string;
}

export function useSaasData() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaComAssinatura[]>([]);
  const [planos, setPlanos] = useState<SaasPlano[]>([]);
  const [assinaturas, setAssinaturas] = useState<SaasAssinatura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    try {
      const email = user?.email;
      console.log('🔍 Verificando superadmin para email:', email);
      
      if (!email) {
        console.log('❌ Nenhum email encontrado');
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      // Use RPC function to avoid recursion issues
      const { data, error } = await supabase
        .rpc('is_superadmin', { user_email: email });

      console.log('📊 Resposta da consulta superadmin:', { data, error });

      const isAdmin = !!data;
      console.log('🎯 É superadmin?', isAdmin);
      setIsSuperAdmin(isAdmin);

      if (isAdmin) {
        console.log('✅ Carregando dados SaaS...');
        await loadData();
      }
    } catch (error) {
      console.error('❌ Erro ao verificar superadmin:', error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      console.log('📊 Carregando dados SaaS...');
      
      // Carregar empresas
      const { data: empresasRaw, error: empresasError } = await supabase
        .from('saas_empresas')
        .select('*')
        .order('nome');
      console.log('📊 Empresas carregadas:', { empresasRaw, empresasError });
      
      // Carregar planos
      const { data: planosData, error: planosError } = await supabase
        .from('saas_planos')
        .select('*')
        .order('nome');
      console.log('📊 Planos carregados:', { planosData, planosError });
      setPlanos(planosData || []);

      // Carregar assinaturas
      const { data: assinaturasData, error: assinaturasError } = await supabase
        .from('saas_assinaturas')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('📊 Assinaturas carregadas:', { assinaturasData, assinaturasError });
      setAssinaturas(assinaturasData || []);
      
      // Mapear empresas com assinaturas
      const empresasComAssinatura = (empresasRaw || []).map(empresa => {
        const assinatura = assinaturasData?.find(a => a.empresa_id === empresa.empresa_id);
        const plano = planosData?.find(p => p.plano_id === assinatura?.plano_id);
        
        // Normalizar status: considera ativa se empresa.ativa E status em ['ativo', 'trial']
        const statusRaw = assinatura?.status || 'inativo';
        const empresaAtiva = empresa.ativa === true;
        const assinaturaAtiva = ['ativo', 'trial'].includes(statusRaw.toLowerCase());
        const statusNormalizado = (empresaAtiva && assinaturaAtiva) ? 'ATIVA' : 'INATIVA';
        
        return {
          empresa_uuid: empresa.empresa_id,
          razao_social: empresa.nome,
          nome_fantasia: empresa.nome,
          cnpj: empresa.cnpj,
          plano: plano?.nome || 'Sem plano',
          valor: assinatura?.valor_mensal || 0,
          dia_vencimento: assinatura?.dia_vencimento || 10,
          status: statusRaw,
          status_normalizado: statusNormalizado,
          ativa: empresaAtiva,
          updated_at: empresa.updated_at
        } as EmpresaComAssinatura;
      });
      
      setEmpresas(empresasComAssinatura);

    } catch (error) {
      console.error('❌ Erro ao carregar dados SaaS:', error);
    }
  };

  const refetchData = () => {
    if (isSuperAdmin) {
      loadData();
    }
  };

  return { 
    isSuperAdmin, 
    empresas, 
    planos, 
    assinaturas, 
    loading,
    refetchData 
  };
}