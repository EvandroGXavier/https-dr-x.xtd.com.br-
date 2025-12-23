import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DadosCNPJ {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  // Dados de Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  // Dados PJ Específicos
  natureza_juridica?: string;
  data_abertura?: string;
  porte?: string;
  situacao?: string;
  regime_tributario?: string;
  cnae_principal?: string;
  municipio_ibge?: string;
}

export function useCnpjPj() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const consultarCNPJ = async (cnpj: string): Promise<DadosCNPJ | null> => {
    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      toast({
        title: "CNPJ Inválido",
        description: "O CNPJ deve conter 14 dígitos.",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    try {
      // Chama a Edge Function existente
      const { data, error } = await supabase.functions.invoke('consultar-cnpj', {
        body: { cnpj: cnpjLimpo }
      });

      if (error) throw error;

      // Mapear dados robustamente da BrasilAPI
      const dadosMapeados: DadosCNPJ = {
        razao_social: data.nome || "",
        nome_fantasia: data.nome_fantasia || "",
        cnpj: cnpjLimpo,
        telefone: data.telefone || "",
        email: data.email || "",
        
        // Endereço
        cep: data.cep || "",
        logradouro: data.endereco || "",
        numero: data.numero || "S/N",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        municipio: data.cidade || "",
        uf: data.uf || "",

        // Dados PJ
        natureza_juridica: data.natureza_juridica || "",
        data_abertura: data.data_abertura || "",
        porte: data.porte || data.porte_empresa || "",
        situacao: data.situacao || data.situacao_cadastral || "",
        regime_tributario: "",
        cnae_principal: data.cnae_principal || data.atividade_principal || "",
        municipio_ibge: String(data.municipio_ibge || ""),
      };

      toast({
        title: "Dados Encontrados",
        description: "O formulário foi preenchido com os dados da Receita Federal.",
      });

      return dadosMapeados;

    } catch (error: any) {
      console.error("Erro CNPJ:", error);
      toast({
        title: "Erro na Consulta",
        description: "Não foi possível buscar os dados deste CNPJ.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { consultarCNPJ, isLoading };
}
