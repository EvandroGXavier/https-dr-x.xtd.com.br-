import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AssinaturaForm from "./forms/AssinaturaForm";
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

interface Assinatura {
  id: string;
  empresa_id: string;
  empresa_nome: string;
  plano: string;
  status: string;
  valor_mensal: number;
  dia_vencimento: number;
  data_inicio: string;
  data_fim: string | null;
  trial_until: string | null;
  created_at: string;
  updated_at: string;
}

export function AssinaturasList() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssinatura, setEditingAssinatura] = useState<Assinatura | null>(null);
  const [deletingAssinatura, setDeletingAssinatura] = useState<Assinatura | null>(null);

  useEffect(() => {
    loadAssinaturas();
  }, []);

  const loadAssinaturas = async () => {
    try {
      setLoading(true);
      
      // Buscar assinaturas com informações da empresa
      const { data: assinaturasData, error } = await supabase
        .from('saas_assinaturas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar empresas para relacionar
      const { data: empresasData } = await supabase
        .from('saas_empresas')
        .select('empresa_id, nome');

      const empresasMap = new Map(
        (empresasData || []).map((emp: any) => [emp.empresa_id, emp.nome])
      );

      const assinaturasComEmpresa = (assinaturasData || []).map((assinatura: any) => ({
        ...assinatura,
        empresa_nome: empresasMap.get(assinatura.empresa_id) || 'N/A'
      }));

      setAssinaturas(assinaturasComEmpresa);
    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      toast.error("Erro ao carregar assinaturas");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assinatura: Assinatura) => {
    setEditingAssinatura(assinatura);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingAssinatura) return;

    try {
      const { error } = await supabase
        .from('saas_assinaturas')
        .delete()
        .eq('assinatura_id', deletingAssinatura.id);

      if (error) throw error;

      toast.success("Assinatura excluída com sucesso!");
      loadAssinaturas();
      setDeletingAssinatura(null);
    } catch (error: any) {
      console.error('Erro ao excluir assinatura:', error);
      toast.error(error.message || "Erro ao excluir assinatura");
    }
  };

  const handleDoubleClick = (assinatura: Assinatura) => {
    handleEdit(assinatura);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      'ATIVA': { variant: 'default', label: 'Ativa' },
      'TRIAL': { variant: 'secondary', label: 'Trial' },
      'SUSPENSA': { variant: 'destructive', label: 'Suspensa' },
      'CANCELADA': { variant: 'secondary', label: 'Cancelada' }
    };
    
    const config = statusMap[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (showForm) {
    return (
      <AssinaturaForm 
        assinatura={editingAssinatura}
        onSuccess={() => {
          setShowForm(false);
          setEditingAssinatura(null);
          loadAssinaturas();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingAssinatura(null);
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Assinaturas Cadastradas
          </CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando assinaturas...</p>
          </div>
        ) : !assinaturas || assinaturas.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhuma assinatura cadastrada no sistema
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar primeira assinatura
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assinaturas.map((assinatura) => (
              <div
                key={assinatura.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onDoubleClick={() => handleDoubleClick(assinatura)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{assinatura.empresa_nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      Plano: {assinatura.plano}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assinatura.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(assinatura)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeletingAssinatura(assinatura)}
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
                    <span className="font-medium">R$ {assinatura.valor_mensal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento:</span>{" "}
                    <span className="font-medium">Dia {assinatura.dia_vencimento || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início:</span>{" "}
                    <span className="font-medium">
                      {assinatura.data_inicio 
                        ? format(new Date(assinatura.data_inicio), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'
                      }
                    </span>
                  </div>
                </div>

                {assinatura.trial_until && (
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    Trial até {format(new Date(assinatura.trial_until), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  Atualizado em {assinatura.updated_at 
                    ? format(new Date(assinatura.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : '-'
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingAssinatura} onOpenChange={() => setDeletingAssinatura(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a assinatura da empresa "{deletingAssinatura?.empresa_nome}"? 
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
