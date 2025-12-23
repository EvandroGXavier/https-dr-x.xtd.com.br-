import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlanoTemplate {
  plano_nome: string;
  valor_mensal: number;
  dia_vencimento: number;
  trial_dias: number;
  limite_usuarios: number;
  limite_filiais: number;
}

const DEFAULT_TEMPLATE: PlanoTemplate = {
  plano_nome: "Básico",
  valor_mensal: 99.90,
  dia_vencimento: 10,
  trial_dias: 15,
  limite_usuarios: 3,
  limite_filiais: 1,
};

export function usePlanoTemplate() {
  const [template, setTemplate] = useState<PlanoTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', 'saas_plano_template')
        .maybeSingle();

      if (error) throw error;

      if (data?.valor) {
        const savedTemplate = JSON.parse(data.valor);
        setTemplate(savedTemplate);
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error);
    } finally {
      setLoading(false);
    }
  };

  return { template, loading, reloadTemplate: loadTemplate };
}
