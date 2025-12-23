import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { TagChip } from "@/components/etiquetas/TagChip";
import { IconSelector } from "@/components/etiquetas/IconSelector";
import { useEtiquetas, Etiqueta } from "@/hooks/useEtiquetas";
import { 
  Plus, 
  Search, 
  Tag,
  Edit,
  Trash2,
  Palette
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const MODULOS_DISPONIVEIS = ['contatos', 'processos', 'agenda', 'financeiro', 'documentos'];

const Etiquetas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    cor: "#6B7280",
    icone: "tag",
    descricao: "",
    escopo_modulos: [] as string[],
    grupo: ""
  });

  const { etiquetas, isLoading, createEtiqueta, updateEtiqueta, deleteEtiqueta } = useEtiquetas();
  const { toast } = useToast();

  const filteredEtiquetas = etiquetas.filter(etiqueta =>
    etiqueta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (etiqueta.descricao && etiqueta.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const resetForm = () => {
    setFormData({
      nome: "",
      cor: "#6B7280",
      icone: "tag",
      descricao: "",
      escopo_modulos: [],
      grupo: ""
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para a etiqueta.",
        variant: "destructive"
      });
      return;
    }

    await createEtiqueta.mutateAsync(formData);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = (etiqueta: Etiqueta) => {
    setEditingEtiqueta(etiqueta);
    setFormData({
      nome: etiqueta.nome,
      cor: etiqueta.cor,
      icone: etiqueta.icone || "tag",
      descricao: etiqueta.descricao || "",
      escopo_modulos: etiqueta.escopo_modulos || [],
      grupo: (etiqueta as any).grupo || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEtiqueta || !formData.nome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para a etiqueta.",
        variant: "destructive"
      });
      return;
    }

    await updateEtiqueta.mutateAsync({
      id: editingEtiqueta.id,
      ...formData
    });
    
    setIsEditDialogOpen(false);
    setEditingEtiqueta(null);
    resetForm();
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a etiqueta "${nome}"?`)) {
      await deleteEtiqueta.mutateAsync(id);
    }
  };

  const getRandomColor = () => {
    const colors = [
      "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
      "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
      "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
      "#EC4899", "#F43F5E"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <AppLayout>
      <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Etiquetas</h1>
                  <p className="text-muted-foreground mt-1">
                    Gerencie as etiquetas do sistema
                  </p>
                </div>
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Etiqueta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Etiqueta</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleCreate} className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome da etiqueta"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="cor">Cor</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="cor"
                              type="color"
                              value={formData.cor}
                              onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                              className="w-16 h-10"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({ ...formData, cor: getRandomColor() })}
                            >
                              <Palette className="h-4 w-4 mr-1" />
                              Aleatória
                            </Button>
                          </div>
                        </div>
                        
                        <IconSelector
                          value={formData.icone}
                          onChange={(icone) => setFormData({ ...formData, icone })}
                        />
                      </div>
                      
                      <div>
                        <Label>Prévia</Label>
                        <div className="flex items-center">
                          <TagChip
                            nome={formData.nome || "Prévia"}
                            cor={formData.cor}
                            icone={formData.icone}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="descricao">Descrição</Label>
                        <Textarea
                          id="descricao"
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                          placeholder="Descrição opcional"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="grupo">Grupo (Opcional)</Label>
                        <Input
                          id="grupo"
                          value={formData.grupo}
                          onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                          placeholder="Ex: Fase do Processo"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Agrupe etiquetas relacionadas. Use "Fase do Processo" para o funil de atendimento.
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-base">Visibilidade</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Selecione onde a etiqueta deve aparecer. Se nada for selecionado, será global.
                        </p>
                        <div className="space-y-2">
                          {MODULOS_DISPONIVEIS.map((modulo) => (
                            <div key={modulo} className="flex items-center space-x-2">
                              <Checkbox
                                id={`modulo-${modulo}`}
                                checked={formData.escopo_modulos.includes(modulo)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData({
                                      ...formData,
                                      escopo_modulos: [...formData.escopo_modulos, modulo]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      escopo_modulos: formData.escopo_modulos.filter(m => m !== modulo)
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`modulo-${modulo}`} className="font-normal capitalize">
                                {modulo}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit">
                          Criar Etiqueta
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <Card className="shadow-soft">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar etiquetas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Etiquetas</p>
                        <p className="text-2xl font-bold text-primary">{etiquetas.length}</p>
                      </div>
                      <Tag className="h-8 w-8 text-primary/70" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Etiquetas Ativas</p>
                        <p className="text-2xl font-bold text-green-600">
                          {etiquetas.filter(e => e.ativa).length}
                        </p>
                      </div>
                      <Tag className="h-8 w-8 text-green-600/70" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Resultados</p>
                        <p className="text-2xl font-bold text-blue-600">{filteredEtiquetas.length}</p>
                      </div>
                      <Search className="h-8 w-8 text-blue-600/70" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Etiquetas Table */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Lista de Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-muted-foreground">Carregando...</div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Etiqueta</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criada em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEtiquetas.map((etiqueta) => (
                          <TableRow key={etiqueta.id}>
                            <TableCell>
                              <TagChip
                                nome={etiqueta.nome}
                                cor={etiqueta.cor}
                                icone={etiqueta.icone}
                              />
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {etiqueta.descricao || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={etiqueta.ativa ? "default" : "secondary"}>
                                {etiqueta.ativa ? "Ativa" : "Inativa"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(etiqueta.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(etiqueta)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(etiqueta.id, etiqueta.nome)}
                                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredEtiquetas.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {searchTerm ? "Nenhuma etiqueta encontrada" : "Nenhuma etiqueta criada ainda"}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
            </Card>
          </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Etiqueta</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da etiqueta"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cor">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="edit-cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, cor: getRandomColor() })}
                  >
                    <Palette className="h-4 w-4 mr-1" />
                    Aleatória
                  </Button>
                </div>
              </div>
              
              <IconSelector
                value={formData.icone}
                onChange={(icone) => setFormData({ ...formData, icone })}
              />
            </div>
            
            <div>
              <Label>Prévia</Label>
              <div className="flex items-center">
                <TagChip
                  nome={formData.nome || "Prévia"}
                  cor={formData.cor}
                  icone={formData.icone}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-descricao">Descrição</Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-grupo">Grupo (Opcional)</Label>
              <Input
                id="edit-grupo"
                value={formData.grupo}
                onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                placeholder="Ex: Fase do Processo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Agrupe etiquetas relacionadas. Use "Fase do Processo" para o funil de atendimento.
              </p>
            </div>
            
            <div>
              <Label className="text-base">Visibilidade</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione onde a etiqueta deve aparecer. Se nada for selecionado, será global.
              </p>
              <div className="space-y-2">
                {MODULOS_DISPONIVEIS.map((modulo) => (
                  <div key={modulo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-modulo-${modulo}`}
                      checked={formData.escopo_modulos.includes(modulo)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            escopo_modulos: [...formData.escopo_modulos, modulo]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            escopo_modulos: formData.escopo_modulos.filter(m => m !== modulo)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`edit-modulo-${modulo}`} className="font-normal capitalize">
                      {modulo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingEtiqueta(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Etiquetas;