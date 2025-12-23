import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, User, Mail, FileText, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePlanoTemplate } from "@/hooks/usePlanoTemplate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmpresaUsuarios from "./EmpresaUsuarios";

interface PlanoOption {
  nome: string;
  valor_padrao: number;
}

interface EmpresasFormProps {
  empresa?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EmpresasForm({ empresa, onSuccess, onCancel }: EmpresasFormProps) {
  const isEditing = !!empresa;
  const { template } = usePlanoTemplate();
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<PlanoOption[]>([]);
  const [empresaUuid, setEmpresaUuid] = useState<string | undefined>(empresa?.empresa_uuid);
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    emailAdmin: "",
    nomeAdmin: "",
    plano: "",
    valor_mensal: 0,
    dia_vencimento: 10,
    trial_dias: 15,
  });

  useEffect(() => {
    loadPlanos();
  }, []);

  useEffect(() => {
    if (empresa && empresa.razao_social) {
      setForm({
        nome: empresa.razao_social || "",
        cnpj: empresa.cnpj || "",
        emailAdmin: "",
        nomeAdmin: "",
        plano: empresa.plano || template.plano_nome,
        valor_mensal: empresa.valor || template.valor_mensal,
        dia_vencimento: empresa.dia_vencimento || template.dia_vencimento,
        trial_dias: template.trial_dias,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.empresa_uuid]);

  useEffect(() => {
    if (!empresa && template.plano_nome) {
      setForm(prev => ({
        ...prev,
        plano: template.plano_nome,
        valor_mensal: template.valor_mensal,
        dia_vencimento: template.dia_vencimento,
        trial_dias: template.trial_dias,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.plano_nome]);

  useEffect(() => {
    const fetchDetalhes = async () => {
      if (!isEditing || !empresa?.empresa_uuid) return;
      try {
        const { data: empRow } = await supabase
          .from('saas_empresas')
          .select('empresa_id, nome, cnpj, plano')
          .eq('empresa_id', empresa.empresa_uuid)
          .maybeSingle();
        if (empRow) {
          setEmpresaUuid(empRow.empresa_id as string);
          setForm((prev) => ({
            ...prev,
            nome: empRow.nome || prev.nome,
            cnpj: empRow.cnpj || "",
            plano: empRow.plano || prev.plano,
          }));
          const { data: assRow } = await supabase
            .from('saas_assinaturas')
            .select('valor_mensal, dia_vencimento')
            .eq('empresa_id', empRow.empresa_id)
            .maybeSingle();
          if (assRow) {
            setForm((prev) => ({
              ...prev,
              valor_mensal: assRow.valor_mensal ?? prev.valor_mensal,
              dia_vencimento: assRow.dia_vencimento ?? prev.dia_vencimento,
            }));
          }
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da empresa:', err);
      }
    };
    fetchDetalhes();
  }, [isEditing, empresa?.empresa_uuid]);

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_planos')
        .select('nome, valor_padrao')
        .order('nome');

      if (error) throw error;
      
      if (data) {
        const planosData: PlanoOption[] = data.map((p: any) => ({
          nome: String(p.nome || ''),
          valor_padrao: Number(p.valor_padrao || 0)
        }));
        setPlanos(planosData);
      } else {
        setPlanos([]);
      }
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      setPlanos([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      if (!form.nome || !form.cnpj) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      setLoading(true);

      try {
        // Atualizar empresa usando UUID
        const { error: empresaError } = await supabase
          .from('saas_empresas')
          .update({
            nome: form.nome,
            cnpj: form.cnpj,
            plano: form.plano,
          })
          .eq('empresa_id', empresa.empresa_uuid);

        if (empresaError) throw empresaError;

        // Verificar se assinatura existe
        const { data: assExistente } = await supabase
          .from('saas_assinaturas')
          .select('assinatura_id, plano_id')
          .eq('empresa_id', empresa.empresa_uuid)
          .maybeSingle();

        if (assExistente) {
          // Assinatura existe, atualizar
          const { error: assinaturaError } = await supabase
            .from('saas_assinaturas')
            .update({
              valor_mensal: form.valor_mensal,
              dia_vencimento: form.dia_vencimento,
            })
            .eq('empresa_id', empresa.empresa_uuid);

          if (assinaturaError) throw assinaturaError;
        } else {
          // Assinatura não existe, criar
          const { data: planoData } = await supabase
            .from('saas_planos')
            .select('plano_id')
            .eq('nome', form.plano)
            .maybeSingle();

          if (planoData) {
            const { error: insertError } = await supabase
              .from('saas_assinaturas')
              .insert({
                empresa_id: empresa.empresa_uuid,
                plano_id: planoData.plano_id,
                valor_mensal: form.valor_mensal,
                dia_vencimento: form.dia_vencimento,
                status: 'ativo',
              });

            if (insertError) throw insertError;
          }
        }

        toast.success("Empresa atualizada com sucesso!");
        onSuccess?.();
      } catch (error: any) {
        console.error('Erro ao atualizar empresa:', error);
        toast.error(error.message || "Erro ao atualizar empresa");
      } finally {
        setLoading(false);
      }
    } else {
      if (!form.nome || !form.cnpj || !form.emailAdmin || !form.nomeAdmin) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      setLoading(true);

      try {
        // Remover máscara do CNPJ
        const cnpjLimpo = form.cnpj.replace(/\D/g, '');

        // Chamar a nova função RPC segura no backend
        const { data: rpcData, error } = await supabase.rpc('fn_provisionar_nova_empresa', {
          p_nome_empresa: form.nome,
          p_cnpj: cnpjLimpo,
          p_admin_email: form.emailAdmin,
          p_admin_nome: form.nomeAdmin,
        });

        if (error) {
          console.error('Erro RPC:', error);
          throw new Error(error.message || 'Erro ao chamar provisionamento.');
        }

        // Cast para o tipo esperado
        const data = rpcData as any;

        // Verificar a resposta JSON da função
        if (data?.sucesso) {
          const descricao = data.email_admin 
            ? `Email: ${data.email_admin} | CNPJ: ${data.cnpj_limpo}`
            : `Configure o administrador posteriormente`;
          
          toast.success(data.mensagem || 'Empresa provisionada com sucesso!', {
            description: descricao,
            duration: 10000,
          });
          onSuccess?.();
        } else {
          throw new Error(data?.mensagem || 'Falha no provisionamento. Verifique os dados.');
        }
      } catch (error: any) {
        console.error('Erro ao provisionar empresa:', error);
        toast.error(error.message || 'Erro ao criar empresa');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {isEditing ? "Editar Empresa" : "Nova Empresa"}
        </CardTitle>
        <CardDescription>
          {isEditing 
            ? "Altere as informações da empresa" 
            : "Cadastre uma nova empresa no sistema com filial matriz e administrador"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dados">
              <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nome da Empresa *
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Xavier Advocacia Ltda"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CNPJ *
            </Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              value={form.cnpj}
              onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-medium">Plano e Configurações</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plano" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Plano
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
                        {plano.nome} - R$ {plano.valor_padrao?.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
          </div>

          {!isEditing && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium">Administrador da Empresa</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nomeAdmin" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="nomeAdmin"
                  placeholder="Ex: João da Silva"
                  value={form.nomeAdmin}
                  onChange={(e) => setForm({ ...form, nomeAdmin: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailAdmin" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail *
                </Label>
                <Input
                  id="emailAdmin"
                  type="email"
                  placeholder="admin@empresa.com.br"
                  value={form.emailAdmin}
                  onChange={(e) => setForm({ ...form, emailAdmin: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Se o usuário já estiver cadastrado, será vinculado automaticamente. 
                  Caso contrário, ele precisará se cadastrar no sistema.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Empresa")}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
            </TabsContent>
            
            <TabsContent value="usuarios">
              <EmpresaUsuarios 
                empresaUuid={empresaUuid || empresa?.empresa_uuid}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Nome da Empresa *
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Xavier Advocacia Ltda"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                CNPJ *
              </Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0001-00"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium">Plano e Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plano" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Plano
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
                          {plano.nome} - R$ {plano.valor_padrao?.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
            </div>

            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium">Administrador da Empresa</h3>
              
              <div className="space-y-2">
                <Label htmlFor="nomeAdmin" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo *
                </Label>
                <Input
                  id="nomeAdmin"
                  placeholder="Ex: João da Silva"
                  value={form.nomeAdmin}
                  onChange={(e) => setForm({ ...form, nomeAdmin: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailAdmin" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail *
                </Label>
                <Input
                  id="emailAdmin"
                  type="email"
                  placeholder="admin@empresa.com.br"
                  value={form.emailAdmin}
                  onChange={(e) => setForm({ ...form, emailAdmin: e.target.value })}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Se o usuário já estiver cadastrado, será vinculado automaticamente. 
                  Caso contrário, ele precisará se cadastrar no sistema.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Criando..." : "Criar Empresa"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
