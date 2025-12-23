import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Building2, Package, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Empresa {
  id: string;
  nome: string;
}

interface Plano {
  nome: string;
  valor_padrao: number;
}

interface Assinatura {
  id: string;
  empresa_id: string;
  plano: string;
  status: string;
  valor_mensal: number;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  trial_until: string | null;
}

interface AssinaturaFormProps {
  assinatura?: Assinatura | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AssinaturaForm({ assinatura, onSuccess, onCancel }: AssinaturaFormProps) {
  const isEditing = !!assinatura;
  const [loading, setLoading] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [form, setForm] = useState({
    empresa_id: "",
    plano: "",
    status: "ATIVA",
    valor_mensal: 0,
    dia_vencimento: 10,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: "",
    trial_dias: 0,
  });

  useEffect(() => {
    loadEmpresas();
    loadPlanos();
  }, []);

  useEffect(() => {
    if (assinatura) {
      setForm({
        empresa_id: assinatura.empresa_id || "",
        plano: assinatura.plano || "",
        status: assinatura.status || "ATIVA",
        valor_mensal: assinatura.valor_mensal || 0,
        dia_vencimento: assinatura.dia_vencimento || 10,
        data_inicio: assinatura.data_inicio ? assinatura.data_inicio.split('T')[0] : new Date().toISOString().split('T')[0],
        data_fim: assinatura.data_fim ? assinatura.data_fim.split('T')[0] : "",
        trial_dias: assinatura.trial_until && assinatura.data_inicio
          ? Math.ceil((new Date(assinatura.trial_until).getTime() - new Date(assinatura.data_inicio).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      });
    }
  }, [assinatura]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_empresas')
        .select('empresa_id, nome')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setEmpresas((data || []).map(e => ({ id: e.empresa_id, nome: e.nome })));
    } catch (error: any) {
      console.error('Erro ao carregar empresas:', error);
      toast.error("Erro ao carregar empresas");
    }
  };

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_planos')
        .select('nome, valor_padrao')
        .order('nome');

      if (error) throw error;
      
      if (data) {
        const planosData: Plano[] = data.map((p: any) => ({
          nome: String(p.nome || ''),
          valor_padrao: Number(p.valor_padrao || 0)
        }));
        setPlanos(planosData);
      }
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast.error("Erro ao carregar planos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.empresa_id || !form.plano) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const trialAte = form.trial_dias > 0 
        ? new Date(new Date(form.data_inicio).getTime() + form.trial_dias * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const assinaturaData = {
        empresa_id: form.empresa_id,
        plano: form.plano,
        status: form.status,
        valor_mensal: form.valor_mensal,
        dia_vencimento: form.dia_vencimento,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        trial_until: trialAte ? trialAte.split('T')[0] : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('saas_assinaturas')
          .update(assinaturaData)
          .eq('assinatura_id', assinatura.id);

        if (error) throw error;
        toast.success("Assinatura atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from('saas_assinaturas')
          .insert(assinaturaData);

        if (error) throw error;
        toast.success("Assinatura criada com sucesso!");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao salvar assinatura:', error);
      toast.error(error.message || "Erro ao salvar assinatura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {isEditing ? "Editar Assinatura" : "Nova Assinatura"}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? "Altere as informações da assinatura" 
            : "Cadastre uma nova assinatura no sistema"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="empresa_id" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa *
            </Label>
            <Select
              value={form.empresa_id}
              onValueChange={(value) => setForm({ ...form, empresa_id: value })}
              disabled={loading || isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plano" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Plano *
              </Label>
              <Select
                value={form.plano}
                onValueChange={(value) => {
                  const planoSelecionado = planos.find(p => p.nome === value);
                  setForm({ 
                    ...form, 
                    plano: value,
                    valor_mensal: planoSelecionado?.valor_padrao || form.valor_mensal
                  });
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano.nome} value={plano.nome}>
                      {plano.nome} - R$ {plano.valor_padrao.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVA">Ativa</SelectItem>
                  <SelectItem value="TRIAL">Trial</SelectItem>
                  <SelectItem value="SUSPENSA">Suspensa</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_mensal" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Mensal (R$)
              </Label>
              <Input
                id="valor_mensal"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_mensal}
                onChange={(e) => setForm({ ...form, valor_mensal: parseFloat(e.target.value) || 0 })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia_vencimento" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dia do Vencimento
              </Label>
              <Select
                value={form.dia_vencimento.toString()}
                onValueChange={(value) => setForm({ ...form, dia_vencimento: parseInt(value) })}
                disabled={loading}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trial_dias">Período Trial (dias)</Label>
              <Input
                id="trial_dias"
                type="number"
                min="0"
                value={form.trial_dias}
                onChange={(e) => setForm({ ...form, trial_dias: parseInt(e.target.value) || 0 })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Assinatura")}
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
