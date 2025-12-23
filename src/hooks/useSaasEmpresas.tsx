import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SaasEmpresa {
  empresa_id?: string;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativa?: boolean;
  plano?: string;
  valor_plano?: number;
  data_vencimento?: string;
}

export function useSaasEmpresas() {
  const [loading, setLoading] = useState(false);

  async function listarEmpresas() {
    try {
      const { data, error } = await supabase
        .from("saas_empresas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("❌ Erro ao carregar empresas:", error);
        toast({ 
          title: "Erro ao carregar empresas", 
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.error("❌ Erro inesperado ao carregar empresas:", err);
      toast({ 
        title: "Erro ao carregar empresas", 
        description: "Erro inesperado ao buscar dados",
        variant: "destructive"
      });
      return [];
    }
  }

  async function salvarEmpresa(values: SaasEmpresa) {
    setLoading(true);
    try {
      const payload = {
        ...values,
        updated_at: new Date().toISOString()
      };

      let result;
      if (values.empresa_id) {
        // Update existing
        const { data, error } = await supabase
          .from("saas_empresas")
          .update(payload)
          .eq("empresa_id", values.empresa_id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("saas_empresas")
          .insert(payload)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast({ 
        title: "✅ Empresa salva com sucesso!", 
        description: `${result.nome} foi ${values.empresa_id ? 'atualizada' : 'criada'} com sucesso.`
      });
      
      return result;
    } catch (error: any) {
      console.error("❌ Erro ao salvar empresa:", error);
      
      // Tratamento especial para CNPJ duplicado
      if (error.message?.includes("Já existe uma empresa")) {
        toast({ 
          title: "CNPJ duplicado", 
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ 
          title: "Erro ao salvar empresa", 
          description: error.message || "Erro desconhecido",
          variant: "destructive"
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function excluirEmpresa(empresaId: string) {
    setLoading(true);
    try {
      // Exclusão lógica - apenas marca como inativa
      const { error } = await supabase
        .from("saas_empresas")
        .update({ 
          ativa: false,
          updated_at: new Date().toISOString()
        })
        .eq("empresa_id", empresaId);
      
      if (error) throw error;

      toast({ 
        title: "✅ Empresa inativada", 
        description: "Empresa marcada como inativa com sucesso."
      });
      
      return true;
    } catch (error: any) {
      console.error("❌ Erro ao inativar empresa:", error);
      toast({ 
        title: "Erro ao inativar empresa", 
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { 
    listarEmpresas, 
    salvarEmpresa, 
    excluirEmpresa, 
    loading 
  };
}
