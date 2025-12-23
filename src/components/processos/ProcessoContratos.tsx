import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HandshakeIcon, Plus, Edit2, Trash2, FileText, Eye } from "lucide-react";
import { useProcessoContratos } from "@/hooks/useProcessoContratos";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { ContatoCombobox } from "@/components/contatos/ContatoCombobox";

const contratoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.enum(["honorarios", "acordo_judicial", "compra_venda", "outros"]),
  cliente_contrato_id: z.string().min(1, "Cliente é obrigatório"),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

const itemSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipo: z.enum(["receita", "despesa"]),
  valor: z.number().positive("Valor deve ser positivo"),
  data_vencimento: z.string().min(1, "Data de vencimento é obrigatória"),
  parcela_numero: z.number().positive().optional(),
  total_parcelas: z.number().positive().optional(),
  observacoes: z.string().optional(),
});

const statusColors = {
  rascunho: "bg-gray-100 text-gray-800",
  enviado: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800", 
  assinado: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive"
};

const tipoLabels = {
  honorarios: "Honorários",
  acordo_judicial: "Acordo Judicial",
  compra_venda: "Compra e Venda",
  outros: "Outros"
};

interface ProcessoContratosProps {
  processoId: string;
}

export function ProcessoContratos({ processoId }: ProcessoContratosProps) {
  const [isContratoDialogOpen, setIsContratoDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<string | null>(null);
  const [editingContrato, setEditingContrato] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { 
    contratos, 
    isLoading, 
    createContrato, 
    updateContrato, 
    deleteContrato,
    updateStatus,
    gerarTransacoesFinanceiras,
    isCreating,
    isUpdating,
    isGeneratingTransactions
  } = useProcessoContratos(processoId);

  const contratoForm = useForm({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      titulo: "",
      tipo: "honorarios" as const,
      cliente_contrato_id: "",
      descricao: "",
      observacoes: "",
    },
  });

  const itemForm = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      descricao: "",
      tipo: "receita" as const,
      valor: 0,
      data_vencimento: "",
      parcela_numero: 1,
      total_parcelas: 1,
      observacoes: "",
    },
  });

  const handleCreateContrato = async (data: any) => {
    try {
      await createContrato({
        ...data,
        processo_id: processoId,
      });
      contratoForm.reset();
      setIsContratoDialogOpen(false);
      toast.success("Contrato criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar contrato");
    }
  };

  const handleUpdateStatus = async (contratoId: string, novoStatus: string) => {
    try {
      await updateStatus(contratoId, novoStatus);
      toast.success("Status atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDeleteContrato = async (contratoId: string) => {
    if (confirm("Tem certeza que deseja excluir este contrato?")) {
      try {
        await deleteContrato(contratoId);
        toast.success("Contrato excluído com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir contrato");
      }
    }
  };

  const handleGerarTransacoes = async (contratoId: string) => {
    if (confirm("Deseja gerar as transações financeiras para este contrato?")) {
      try {
        const result = await gerarTransacoesFinanceiras(contratoId);
        const totalGerado = typeof result === 'object' && result !== null && 'total_gerado' in result 
          ? (result as any).total_gerado 
          : 'algumas';
        toast.success(`${totalGerado} transações geradas com sucesso!`);
      } catch (error: any) {
        toast.error(error.message || "Erro ao gerar transações financeiras");
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandshakeIcon className="h-5 w-5" />
            Contratos do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
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
            <HandshakeIcon className="h-5 w-5" />
            Contratos do Processo
          </div>
          <Dialog open={isContratoDialogOpen} onOpenChange={setIsContratoDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingContrato ? "Editar Contrato" : "Novo Contrato"}
                </DialogTitle>
              </DialogHeader>
              <Form {...contratoForm}>
                <form onSubmit={contratoForm.handleSubmit(handleCreateContrato)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={contratoForm.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Contrato de Honorários" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={contratoForm.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="honorarios">Honorários</SelectItem>
                              <SelectItem value="acordo_judicial">Acordo Judicial</SelectItem>
                              <SelectItem value="compra_venda">Compra e Venda</SelectItem>
                              <SelectItem value="outros">Outros</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={contratoForm.control}
                    name="cliente_contrato_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente do Contrato</FormLabel>
                        <FormControl>
                          <ContatoCombobox
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Selecione o cliente do contrato..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contratoForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descrição do contrato" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={contratoForm.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Observações adicionais" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsContratoDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Criando..." : "Criar Contrato"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {contratos?.length === 0 ? (
          <div className="text-center py-8">
            <HandshakeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum contrato cadastrado para este processo.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsContratoDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Contrato
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {contratos?.map((contrato: any) => (
              <Card key={contrato.id} className="border-l-4 border-l-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{contrato.titulo}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tipoLabels[contrato.tipo as keyof typeof tipoLabels]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[contrato.status as keyof typeof statusColors]}>
                        {contrato.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteContrato(contrato.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {contrato.descricao && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {contrato.descricao}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      Valor Total: {contrato.valor_total ? 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(contrato.valor_total) : 
                        'N/A'
                      }
                    </span>
                    <span className="text-muted-foreground">
                      Criado em {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {contrato.status === 'rascunho' && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(contrato.id, 'enviado')}
                        disabled={isUpdating}
                      >
                        Enviar para Aprovação
                      </Button>
                    </div>
                  )}
                  
                  {contrato.status === 'enviado' && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateStatus(contrato.id, 'aprovado')}
                        disabled={isUpdating}
                      >
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus(contrato.id, 'cancelado')}
                        disabled={isUpdating}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                  
                  {(contrato.status === 'aprovado' || contrato.status === 'assinado') && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleGerarTransacoes(contrato.id)}
                        disabled={isGeneratingTransactions}
                      >
                        {isGeneratingTransactions ? "Gerando..." : "Gerar Transações Financeiras"}
                      </Button>
                      {contrato.status === 'aprovado' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleUpdateStatus(contrato.id, 'assinado')}
                          disabled={isUpdating}
                        >
                          Marcar como Assinado
                        </Button>
                      )}
                    </div>
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