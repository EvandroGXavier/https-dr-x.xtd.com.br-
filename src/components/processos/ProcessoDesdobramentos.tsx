import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Plus, Edit2, Trash2 } from "lucide-react";
import { useProcessoDesdobramentos } from "@/hooks/useProcessoDesdobramentos";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoDesdobramentosProps {
  processoId: string;
}

const statusColors = {
  ativo: "bg-green-500",
  finalizado: "bg-blue-500",
  suspenso: "bg-yellow-500",
  arquivado: "bg-gray-500",
};

const statusLabels = {
  ativo: "Ativo",
  finalizado: "Finalizado",
  suspenso: "Suspenso",
  arquivado: "Arquivado",
};

export function ProcessoDesdobramentos({ processoId }: ProcessoDesdobramentosProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDesdobramento, setEditingDesdobramento] = useState<any>(null);
  const [formData, setFormData] = useState({
    numero_processo: "",
    tipo: "",
    status: "ativo" as const,
    tribunal: "",
    comarca: "",
    vara: "",
    data_distribuicao: "",
    descricao: "",
  });

  const { desdobramentos, isLoading, createDesdobramento, updateDesdobramento, deleteDesdobramento } = useProcessoDesdobramentos(processoId);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      numero_processo: "",
      tipo: "",
      status: "ativo",
      tribunal: "",
      comarca: "",
      vara: "",
      data_distribuicao: "",
      descricao: "",
    });
    setEditingDesdobramento(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDesdobramento) {
        await updateDesdobramento({ id: editingDesdobramento.id, ...formData });
        toast({ title: "Desdobramento atualizado com sucesso!" });
      } else {
        await createDesdobramento(formData);
        toast({ title: "Desdobramento criado com sucesso!" });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar desdobramento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (desdobramento: any) => {
    setEditingDesdobramento(desdobramento);
    setFormData({
      numero_processo: desdobramento.numero_processo || "",
      tipo: desdobramento.tipo || "",
      status: desdobramento.status || "ativo",
      tribunal: desdobramento.tribunal || "",
      comarca: desdobramento.comarca || "",
      vara: desdobramento.vara || "",
      data_distribuicao: desdobramento.data_distribuicao || "",
      descricao: desdobramento.descricao || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este desdobramento?")) {
      try {
        await deleteDesdobramento(id);
        toast({ title: "Desdobramento excluído com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir desdobramento",
          description: "Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Desdobramentos do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Desdobramentos do Processo
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Desdobramento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDesdobramento ? "Editar Desdobramento" : "Novo Desdobramento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_processo">Número do Processo *</Label>
                    <Input
                      id="numero_processo"
                      value={formData.numero_processo}
                      onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Input
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      placeholder="Ex: Recurso, Execução, Cautelar"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="data_distribuicao">Data de Distribuição</Label>
                    <Input
                      id="data_distribuicao"
                      type="date"
                      value={formData.data_distribuicao}
                      onChange={(e) => setFormData({ ...formData, data_distribuicao: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tribunal">Tribunal</Label>
                    <Input
                      id="tribunal"
                      value={formData.tribunal}
                      onChange={(e) => setFormData({ ...formData, tribunal: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="comarca">Comarca</Label>
                    <Input
                      id="comarca"
                      value={formData.comarca}
                      onChange={(e) => setFormData({ ...formData, comarca: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vara">Vara</Label>
                    <Input
                      id="vara"
                      value={formData.vara}
                      onChange={(e) => setFormData({ ...formData, vara: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingDesdobramento ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!desdobramentos?.length ? (
          <div className="text-center py-8">
            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum desdobramento encontrado para este processo.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Desdobramento" para adicionar recursos, execuções ou outros desdobramentos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {desdobramentos.map((desdobramento) => (
              <Card key={desdobramento.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{desdobramento.tipo}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(desdobramento)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(desdobramento.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <h4 className="font-medium">{desdobramento.numero_processo}</h4>
                  
                  <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-muted-foreground">
                    {desdobramento.tribunal && (
                      <div>
                        <strong>Tribunal:</strong> {desdobramento.tribunal}
                      </div>
                    )}
                    {desdobramento.comarca && (
                      <div>
                        <strong>Comarca:</strong> {desdobramento.comarca}
                      </div>
                    )}
                    {desdobramento.vara && (
                      <div>
                        <strong>Vara:</strong> {desdobramento.vara}
                      </div>
                    )}
                  </div>
                  
                  {desdobramento.data_distribuicao && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <strong>Data de Distribuição:</strong>{" "}
                      {format(new Date(desdobramento.data_distribuicao), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                  
                  {desdobramento.descricao && (
                    <p className="mt-2 text-sm">{desdobramento.descricao}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}