import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkflowModelos, WorkflowModelo, WorkflowPasso } from "@/hooks/useWorkflowModelos";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listarModelos, listarPassos, salvarModelo, salvarPasso, excluirPasso } = useWorkflowModelos();

  const [modelo, setModelo] = useState<Partial<WorkflowModelo>>({
    codigo: "",
    nome: "",
    descricao: "",
    tipo_referencia: "processo",
    gatilho: "processo.created",
    filtros: {},
    configuracao: {},
    ativo: true,
  });

  const [passos, setPassos] = useState<Partial<WorkflowPasso>[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (id) {
      carregarModelo();
    }
  }, [id]);

  const carregarModelo = async () => {
    try {
      const modelos = await listarModelos();
      const modeloEncontrado = modelos.find((m) => m.id === id);
      if (modeloEncontrado) {
        setModelo(modeloEncontrado);
        const passosData = await listarPassos(id!);
        setPassos(passosData);
      }
    } catch (error) {
      console.error("Erro ao carregar workflow:", error);
      toast.error("Erro ao carregar workflow");
    }
  };

  const handleSalvar = async () => {
    if (!modelo.codigo || !modelo.nome) {
      toast.error("Preencha código e nome do workflow");
      return;
    }

    setSalvando(true);
    try {
      const modeloSalvo = await salvarModelo(modelo);
      
      for (const passo of passos) {
        await salvarPasso({
          ...passo,
          workflow_modelo_id: modeloSalvo?.id || id!,
        });
      }

      toast.success("Workflow salvo com sucesso");
      navigate("/workflow");
    } catch (error) {
      console.error("Erro ao salvar workflow:", error);
      toast.error("Erro ao salvar workflow");
    } finally {
      setSalvando(false);
    }
  };

  const adicionarPasso = () => {
    setPassos([
      ...passos,
      {
        ordem: passos.length + 1,
        tipo_acao: "gerar_documentos",
        descricao: "",
        configuracao: {},
        ativo: true,
      },
    ]);
  };

  const removerPasso = (index: number) => {
    setPassos(passos.filter((_, i) => i !== index));
  };

  const atualizarPasso = (index: number, campo: string, valor: any) => {
    const novosPassos = [...passos];
    novosPassos[index] = {
      ...novosPassos[index],
      [campo]: valor,
    };
    setPassos(novosPassos);
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/workflow")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {id ? "Editar Workflow" : "Novo Workflow"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure ações automáticas para seus processos
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  value={modelo.codigo}
                  onChange={(e) => setModelo({ ...modelo, codigo: e.target.value })}
                  placeholder="ex: inventario_abertura"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={modelo.nome}
                  onChange={(e) => setModelo({ ...modelo, nome: e.target.value })}
                  placeholder="ex: Inventário - Documentos iniciais"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={modelo.descricao || ""}
                onChange={(e) => setModelo({ ...modelo, descricao: e.target.value })}
                placeholder="Descreva o propósito deste workflow"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gatilho">Gatilho</Label>
                <Select
                  value={modelo.gatilho}
                  onValueChange={(value) => setModelo({ ...modelo, gatilho: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processo.created">Processo Criado</SelectItem>
                    <SelectItem value="processo.updated">Processo Atualizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="ativo"
                  checked={modelo.ativo}
                  onCheckedChange={(checked) => setModelo({ ...modelo, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Passos do Workflow</CardTitle>
            <Button onClick={adicionarPasso} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Passo
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {passos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum passo adicionado ainda
              </p>
            )}

            {passos.map((passo, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Tipo de Ação</Label>
                          <Select
                            value={passo.tipo_acao}
                            onValueChange={(value) => atualizarPasso(index, "tipo_acao", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gerar_documentos">Gerar Documentos</SelectItem>
                              <SelectItem value="criar_tarefa">Criar Tarefa</SelectItem>
                              <SelectItem value="criar_evento_agenda">Criar Evento Agenda</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ordem</Label>
                          <Input
                            type="number"
                            value={passo.ordem}
                            onChange={(e) => atualizarPasso(index, "ordem", parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Input
                          value={passo.descricao || ""}
                          onChange={(e) => atualizarPasso(index, "descricao", e.target.value)}
                          placeholder="Descreva este passo"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Configuração (JSON)</Label>
                        <Textarea
                          value={JSON.stringify(passo.configuracao || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const config = JSON.parse(e.target.value);
                              atualizarPasso(index, "configuracao", config);
                            } catch {}
                          }}
                          placeholder='{"documentos_modelos_ids": ["uuid1", "uuid2"]}'
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerPasso(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/workflow")}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar Workflow"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
