import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSaasData } from "./hooks/useSaasData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import EmpresasForm from "./forms/EmpresasForm";
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

export function EmpresasList() {
  const { empresas, loading, refetchData } = useSaasData();
  const [showForm, setShowForm] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<any>(null);
  const [deletingEmpresa, setDeletingEmpresa] = useState<any>(null);

  const handleEdit = (empresa: any) => {
    setEditingEmpresa(empresa);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingEmpresa) return;

    try {
      // Desativar empresa
      const { error: empresaError } = await supabase
        .from('saas_empresas')
        .update({ ativa: false })
        .eq('empresa_id', deletingEmpresa.empresa_uuid);

      if (empresaError) throw empresaError;

      // Atualizar status da assinatura para cancelada
      const { error: assinaturaError } = await supabase
        .from('saas_assinaturas')
        .update({ status: 'cancelada' })
        .eq('empresa_id', deletingEmpresa.empresa_uuid);

      if (assinaturaError) {
        console.warn('Aviso ao atualizar assinatura:', assinaturaError);
      }

      toast.success("Empresa desativada com sucesso!");
      refetchData();
      setDeletingEmpresa(null);
    } catch (error: any) {
      console.error('Erro ao desativar empresa:', error);
      toast.error(error.message || "Erro ao desativar empresa");
    }
  };

  const handleDoubleClick = (empresa: any) => {
    handleEdit(empresa);
  };

  if (showForm) {
    return (
      <EmpresasForm 
        empresa={editingEmpresa}
        onSuccess={() => {
          setShowForm(false);
          setEditingEmpresa(null);
          refetchData();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingEmpresa(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Empresas Cadastradas
          </CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando empresas...</p>
          </div>
        ) : !empresas || empresas.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhuma empresa cadastrada no sistema
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeira empresa
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {empresas.map((empresa) => (
              <div
                key={empresa.empresa_uuid}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onDoubleClick={() => handleDoubleClick(empresa)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{empresa.razao_social}</h3>
                    {empresa.nome_fantasia && empresa.nome_fantasia !== empresa.razao_social && (
                      <p className="text-sm text-muted-foreground">
                        {empresa.nome_fantasia}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={empresa.status_normalizado === 'ATIVA' ? 'default' : 'secondary'}>
                      {empresa.status_normalizado}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(empresa)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingEmpresa(empresa)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Plano:</span>{" "}
                    <span className="font-medium">{empresa.plano}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento:</span>{" "}
                    <span className="font-medium">Dia {empresa.dia_vencimento}</span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Atualizado em {empresa.updated_at ? format(new Date(empresa.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingEmpresa} onOpenChange={() => setDeletingEmpresa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a empresa "{deletingEmpresa?.razao_social}"? 
              Esta ação pode ser revertida posteriormente reativando a empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}