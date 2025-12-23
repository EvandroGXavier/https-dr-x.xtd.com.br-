import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, FileText, Download } from "lucide-react";
import { useProcessoMovimentacoes, type MovimentacaoTipo } from "@/hooks/useProcessos";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoMovimentacoesProps {
  processoId: string;
}

const tipoLabels: Record<MovimentacaoTipo, string> = {
  decisao: "Decisão",
  despacho: "Despacho",
  audiencia: "Audiência",
  juntada: "Juntada",
  peticao: "Petição",
  sentenca: "Sentença",
  recurso: "Recurso",
  outros: "Outros"
};

const tipoColors: Record<MovimentacaoTipo, string> = {
  decisao: "bg-primary/10 text-primary",
  despacho: "bg-blue-100 text-blue-800",
  audiencia: "bg-green-100 text-green-800",
  juntada: "bg-yellow-100 text-yellow-800",
  peticao: "bg-purple-100 text-purple-800",
  sentenca: "bg-red-100 text-red-800",
  recurso: "bg-orange-100 text-orange-800",
  outros: "bg-muted text-muted-foreground"
};

export function ProcessoMovimentacoes({ processoId }: ProcessoMovimentacoesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMovimentacao, setEditingMovimentacao] = useState<any>(null);
  const [newMovimentacao, setNewMovimentacao] = useState({
    data_movimentacao: new Date().toISOString().split('T')[0] + 'T' + new Date().toISOString().split('T')[1].split('.')[0],
    tipo: "outros" as MovimentacaoTipo,
    titulo: "",
    descricao: "",
    id_tribunal: "",
    documento_url: "",
    documento_nome: ""
  });

  const { movimentacoes, isLoading, addMovimentacao, updateMovimentacao } = useProcessoMovimentacoes(processoId);

  const handleAddMovimentacao = async () => {
    try {
      await addMovimentacao({
        processo_id: processoId,
        ...newMovimentacao
      });
      setNewMovimentacao({
        data_movimentacao: new Date().toISOString().split('T')[0] + 'T' + new Date().toISOString().split('T')[1].split('.')[0],
        tipo: "outros",
        titulo: "",
        descricao: "",
        id_tribunal: "",
        documento_url: "",
        documento_nome: ""
      });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Erro ao adicionar movimentação:", error);
    }
  };

  const handleEditMovimentacao = async () => {
    if (!editingMovimentacao) return;
    
    try {
      await updateMovimentacao({
        id: editingMovimentacao.id,
        data_movimentacao: editingMovimentacao.data_movimentacao,
        tipo: editingMovimentacao.tipo,
        titulo: editingMovimentacao.titulo,
        descricao: editingMovimentacao.descricao,
        id_tribunal: editingMovimentacao.id_tribunal,
        documento_url: editingMovimentacao.documento_url,
        documento_nome: editingMovimentacao.documento_nome
      });
      setEditingMovimentacao(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar movimentação:", error);
    }
  };

  const handleDoubleClick = (mov: any) => {
    setEditingMovimentacao({
      id: mov.id,
      data_movimentacao: mov.data_movimentacao.replace('Z', '').slice(0, 19),
      tipo: mov.tipo,
      titulo: mov.titulo,
      descricao: mov.descricao || "",
      id_tribunal: mov.id_tribunal || "",
      documento_url: mov.documento_url || "",
      documento_nome: mov.documento_nome || ""
    });
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Movimentações Processuais ({movimentacoes.length})
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Movimentação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Movimentação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_movimentacao">Data/Hora *</Label>
                      <Input
                        id="data_movimentacao"
                        type="datetime-local"
                        value={newMovimentacao.data_movimentacao}
                        onChange={(e) => setNewMovimentacao(prev => ({ ...prev, data_movimentacao: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <select
                        id="tipo"
                        className="h-10 px-3 rounded-md border border-input bg-background text-sm w-full"
                        value={newMovimentacao.tipo}
                        onChange={(e) => setNewMovimentacao(prev => ({ ...prev, tipo: e.target.value as MovimentacaoTipo }))}
                      >
                        {Object.entries(tipoLabels).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={newMovimentacao.titulo}
                      onChange={(e) => setNewMovimentacao(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Ex: Decisão interlocutória"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="id_tribunal">ID Tribunal</Label>
                    <Input
                      id="id_tribunal"
                      value={newMovimentacao.id_tribunal}
                      onChange={(e) => setNewMovimentacao(prev => ({ ...prev, id_tribunal: e.target.value }))}
                      placeholder="ID nativo do tribunal (se disponível)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={newMovimentacao.descricao}
                      onChange={(e) => setNewMovimentacao(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição detalhada da movimentação..."
                      rows={4}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documento_nome">Nome do Documento</Label>
                      <Input
                        id="documento_nome"
                        value={newMovimentacao.documento_nome}
                        onChange={(e) => setNewMovimentacao(prev => ({ ...prev, documento_nome: e.target.value }))}
                        placeholder="Ex: decisao_123.pdf"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="documento_url">URL do Documento</Label>
                      <Input
                        id="documento_url"
                        value={newMovimentacao.documento_url}
                        onChange={(e) => setNewMovimentacao(prev => ({ ...prev, documento_url: e.target.value }))}
                        placeholder="URL ou caminho do documento"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddMovimentacao} disabled={!newMovimentacao.titulo}>
                      Adicionar Movimentação
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {movimentacoes.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma movimentação registrada ainda. Clique em "Nova Movimentação" para começar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {movimentacoes.map((mov: any) => (
                <Card 
                  key={mov.id} 
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" 
                  onDoubleClick={() => handleDoubleClick(mov)}
                  title="Duplo clique para editar"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={tipoColors[mov.tipo as MovimentacaoTipo]}>
                        {tipoLabels[mov.tipo as MovimentacaoTipo]}
                      </Badge>
                      {mov.id_tribunal && (
                        <Badge variant="outline">
                          ID: {mov.id_tribunal}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(mov.data_movimentacao).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg">{mov.titulo}</h4>
                    
                    {mov.descricao && (
                      <p className="text-base leading-relaxed">{mov.descricao}</p>
                    )}

                    {(mov.documento_nome || mov.documento_url) && (
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mov.documento_nome || "Documento anexo"}</span>
                        {mov.documento_url && (
                          <Button variant="ghost" size="sm" className="ml-auto gap-1">
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Registrado {formatDistanceToNow(new Date(mov.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          {editingMovimentacao && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_data_movimentacao">Data/Hora *</Label>
                  <Input
                    id="edit_data_movimentacao"
                    type="datetime-local"
                    value={editingMovimentacao.data_movimentacao}
                    onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, data_movimentacao: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_tipo">Tipo *</Label>
                  <select
                    id="edit_tipo"
                    className="h-10 px-3 rounded-md border border-input bg-background text-sm w-full"
                    value={editingMovimentacao.tipo}
                    onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, tipo: e.target.value as MovimentacaoTipo })}
                  >
                    {Object.entries(tipoLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_titulo">Título *</Label>
                <Input
                  id="edit_titulo"
                  value={editingMovimentacao.titulo}
                  onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_id_tribunal">ID Tribunal</Label>
                <Input
                  id="edit_id_tribunal"
                  value={editingMovimentacao.id_tribunal}
                  onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, id_tribunal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_descricao">Descrição</Label>
                <Textarea
                  id="edit_descricao"
                  value={editingMovimentacao.descricao}
                  onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, descricao: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_documento_nome">Nome do Documento</Label>
                  <Input
                    id="edit_documento_nome"
                    value={editingMovimentacao.documento_nome}
                    onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, documento_nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_documento_url">URL do Documento</Label>
                  <Input
                    id="edit_documento_url"
                    value={editingMovimentacao.documento_url}
                    onChange={(e) => setEditingMovimentacao({ ...editingMovimentacao, documento_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditMovimentacao} disabled={!editingMovimentacao.titulo}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}