import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PlanoForm from "./forms/PlanoForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

export function PlanosList() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null);
  const [deletingPlano, setDeletingPlano] = useState<Plano | null>(null);

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('saas_planos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setPlanos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar planos:', error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plano: Plano) => {
    setEditingPlano(plano);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingPlano) return;

    try {
      const { error } = await supabase
        .from('saas_planos')
        .delete()
        .eq('plano_id', deletingPlano.plano_id);

      if (error) throw error;

      toast.success("Plano excluído com sucesso!");
      loadPlanos();
      setDeletingPlano(null);
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error);
      toast.error(error.message || "Erro ao excluir plano");
    }
  };

  const handleDoubleClick = (plano: Plano) => {
    handleEdit(plano);
  };

  if (showForm) {
    return (
      <PlanoForm 
        plano={editingPlano}
        onSuccess={() => {
          setShowForm(false);
          setEditingPlano(null);
          loadPlanos();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingPlano(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Planos Cadastrados
          </CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        ) : !planos || planos.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhum plano cadastrado no sistema
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeiro plano
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {planos.map((plano) => (
              <div
                key={plano.plano_id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onDoubleClick={() => handleDoubleClick(plano)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{plano.nome}</h3>
                    {plano.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {plano.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(plano)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingPlano(plano)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor:</span>{" "}
                    <span className="font-medium">R$ {plano.valor_padrao.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usuários:</span>{" "}
                    <span className="font-medium">
                      {plano.limite_usuarios ? plano.limite_usuarios : 'Ilimitado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Filiais:</span>{" "}
                    <span className="font-medium">
                      {plano.limite_filiais ? plano.limite_filiais : 'Ilimitado'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Atualizado em {format(new Date(plano.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingPlano} onOpenChange={() => setDeletingPlano(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o plano "{deletingPlano?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
