import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function PlanoTemplateConfig() {
  const [template, setTemplate] = useState<PlanoTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert({
          chave: 'saas_plano_template',
          valor: JSON.stringify(template),
          tenant_id: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'chave,tenant_id'
        });

      if (error) throw error;

      toast.success("Template salvo com sucesso!");
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error(error.message || "Erro ao salvar template");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATE);
    toast.info("Template resetado para valores padrão");
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Template de Plano Padrão
        </CardTitle>
        <CardDescription>
          Configure o template padrão que será usado ao criar novos planos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="plano_nome">Nome do Plano</Label>
            <Input
              id="plano_nome"
              value={template.plano_nome}
              onChange={(e) => setTemplate({ ...template, plano_nome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
            <Input
              id="valor_mensal"
              type="number"
              step="0.01"
              min="0"
              value={template.valor_mensal}
              onChange={(e) => setTemplate({ ...template, valor_mensal: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
            <Select
              value={template.dia_vencimento.toString()}
              onValueChange={(value) => setTemplate({ ...template, dia_vencimento: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Dia {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trial_dias">Período de Trial (dias)</Label>
            <Input
              id="trial_dias"
              type="number"
              min="0"
              value={template.trial_dias}
              onChange={(e) => setTemplate({ ...template, trial_dias: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite_usuarios">Limite de Usuários</Label>
            <Input
              id="limite_usuarios"
              type="number"
              min="1"
              value={template.limite_usuarios}
              onChange={(e) => setTemplate({ ...template, limite_usuarios: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite_filiais">Limite de Filiais</Label>
            <Input
              id="limite_filiais"
              type="number"
              min="1"
              value={template.limite_filiais}
              onChange={(e) => setTemplate({ ...template, limite_filiais: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Template"}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
