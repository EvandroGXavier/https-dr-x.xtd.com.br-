import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Package, DollarSign, Users, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plano {
  plano_id: string;
  nome: string;
  descricao: string | null;
  valor_padrao: number;
  limite_usuarios: number | null;
  limite_filiais: number | null;
  created_at: string;
  updated_at: string;
}

interface PlanoFormProps {
  plano?: Plano | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PlanoForm({ plano, onSuccess, onCancel }: PlanoFormProps) {
  const isEditing = !!plano;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valor_padrao: 0,
    limite_usuarios: null as number | null,
    limite_filiais: null as number | null,
    usuarios_ilimitados: true,
    filiais_ilimitadas: true,
    eh_trial: false,
  });

  useEffect(() => {
    if (plano) {
      setForm({
        nome: plano.nome || "",
        descricao: plano.descricao || "",
        valor_padrao: plano.valor_padrao || 0,
        limite_usuarios: plano.limite_usuarios,
        limite_filiais: plano.limite_filiais,
        usuarios_ilimitados: !plano.limite_usuarios,
        filiais_ilimitadas: !plano.limite_filiais,
        eh_trial: (plano as any).eh_trial || false,
      });
    }
  }, [plano]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome) {
      toast.error("Preencha o nome do plano");
      return;
    }

    if (form.valor_padrao < 0) {
      toast.error("O valor do plano não pode ser negativo");
      return;
    }

    setLoading(true);

    try {
      const planoData = {
        nome: form.nome,
        descricao: form.descricao || null,
        valor_padrao: form.valor_padrao,
        limite_usuarios: form.usuarios_ilimitados ? null : form.limite_usuarios,
        limite_filiais: form.filiais_ilimitadas ? null : form.limite_filiais,
        eh_trial: form.eh_trial,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('saas_planos')
          .update(planoData)
          .eq('plano_id', plano.plano_id);

        if (error) throw error;
        toast.success("Plano atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('saas_planos')
          .insert(planoData);

        if (error) throw error;
        toast.success("Plano criado com sucesso!");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {isEditing ? "Editar Plano" : "Novo Plano"}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? "Altere as informações do plano" 
            : "Cadastre um novo plano no sistema"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Nome do Plano *
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Básico, Profissional, Enterprise"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição detalhada do plano"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_padrao" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Padrão (R$) *
            </Label>
            <Input
              id="valor_padrao"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.valor_padrao}
              onChange={(e) => setForm({ ...form, valor_padrao: parseFloat(e.target.value) || 0 })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="eh_trial" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Plano Trial (Teste Gratuito)
              </Label>
              <Switch
                id="eh_trial"
                checked={form.eh_trial}
                onCheckedChange={(checked) => setForm({ ...form, eh_trial: checked })}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Marque se este é o plano padrão de Trial. Apenas um plano deve ter esta flag ativa.
            </p>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium">Limites do Plano</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="limite_usuarios" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Limite de Usuários
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="usuarios_ilimitados" className="text-sm">Ilimitado</Label>
                    <Switch
                      id="usuarios_ilimitados"
                      checked={form.usuarios_ilimitados}
                      onCheckedChange={(checked) => 
                        setForm({ ...form, usuarios_ilimitados: checked, limite_usuarios: checked ? null : 1 })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                {!form.usuarios_ilimitados && (
                  <Input
                    id="limite_usuarios"
                    type="number"
                    min="1"
                    placeholder="Número de usuários"
                    value={form.limite_usuarios || ""}
                    onChange={(e) => setForm({ ...form, limite_usuarios: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="limite_filiais" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Limite de Filiais
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="filiais_ilimitadas" className="text-sm">Ilimitado</Label>
                    <Switch
                      id="filiais_ilimitadas"
                      checked={form.filiais_ilimitadas}
                      onCheckedChange={(checked) => 
                        setForm({ ...form, filiais_ilimitadas: checked, limite_filiais: checked ? null : 1 })
                      }
                      disabled={loading}
                    />
                  </div>
                </div>
                {!form.filiais_ilimitadas && (
                  <Input
                    id="limite_filiais"
                    type="number"
                    min="1"
                    placeholder="Número de filiais"
                    value={form.limite_filiais || ""}
                    onChange={(e) => setForm({ ...form, limite_filiais: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Plano")}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
