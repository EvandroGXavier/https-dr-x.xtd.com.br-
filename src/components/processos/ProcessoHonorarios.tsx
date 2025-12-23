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
import { ScaleIcon, Plus, Edit2, Trash2, FileText, Check, AlertTriangle, DollarSign } from "lucide-react";
import { useProcessoHonorarios } from "@/hooks/useProcessoHonorarios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const honorarioSchema = z.object({
  objeto: z.string().min(1, "Objeto é obrigatório"),
  valor_causa: z.number().min(0, "Valor da causa deve ser positivo").optional(),
  valor_contrato: z.number().min(0, "Valor do contrato deve ser positivo").optional(),
  forma_pagamento: z.enum(["boleto", "pix", "transferencia", "cartao", "dinheiro", "cheque"]).default("boleto"),
  observacoes: z.string().optional(),
});

const itemSchema = z.object({
  tipo: z.enum(["consultoria", "advocacia", "representacao", "elaboracao_peca", "audiencia", "recurso", "outros"]),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  valor_sugerido: z.number().min(0, "Valor deve ser positivo"),
  valor_aprovado: z.number().min(0, "Valor deve ser positivo").optional(),
  valor_cobrado: z.number().min(0, "Valor deve ser positivo").optional(),
  percentual_exito: z.number().min(0).max(100).optional(),
  referencia_oab: z.string().optional(),
  observacoes: z.string().optional(),
});

const parcelaSchema = z.object({
  numero_parcela: z.number().min(1, "Número da parcela é obrigatório"),
  valor: z.number().min(0, "Valor deve ser positivo"),
  data_vencimento: z.date(),
  data_pagamento: z.date().optional(),
  status_pagamento: z.enum(["pendente", "pago", "vencido", "cancelado"]).default("pendente"),
  observacoes: z.string().optional(),
});

const statusColors = {
  rascunho: "bg-muted text-muted-foreground",
  aprovado: "bg-blue-100 text-blue-800",
  assinado: "bg-success/10 text-success",
  cancelado: "bg-destructive/10 text-destructive"
};

const tipoLabels = {
  inicial: "Inicial",
  mensal: "Mensal",
  exito: "Êxito",
  outros: "Outros"
};

const tipoColors = {
  inicial: "bg-primary/10 text-primary",
  mensal: "bg-secondary/10 text-secondary",
  exito: "bg-success/10 text-success",
  outros: "bg-muted text-muted-foreground"
};

interface ProcessoHonorariosProps {
  processoId: string;
}

export function ProcessoHonorarios({ processoId }: ProcessoHonorariosProps) {
  const [isHonorarioDialogOpen, setIsHonorarioDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isParcelaDialogOpen, setIsParcelaDialogOpen] = useState(false);
  const [selectedHonorario, setSelectedHonorario] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editingHonorario, setEditingHonorario] = useState<any>(null);

  const { 
    honorarios, 
    itens, 
    parcelas, 
    isLoading, 
    createHonorario, 
    updateHonorario, 
    deleteHonorario,
    createItem,
    updateItem,
    deleteItem,
    createParcela,
    updateParcela,
    deleteParcela,
    aprovarHonorario,
    assinarHonorario,
    gerarTitulosFinanceiros,
    isCreating,
    isUpdating,
    isGeneratingTitulos
  } = useProcessoHonorarios(processoId);

  const honorarioForm = useForm({
    resolver: zodResolver(honorarioSchema),
    defaultValues: {
      objeto: "",
      observacoes: "",
    },
  });

  const itemForm = useForm({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      tipo: "inicial" as const,
      descricao: "",
      valor_definido: 0,
      valor_cobrado: 0,
      percentual_exito: 0,
      referencia_oab: "",
      observacoes: "",
    },
  });

  const parcelaForm = useForm({
    resolver: zodResolver(parcelaSchema),
    defaultValues: {
      numero_parcela: 1,
      valor: 0,
      data_vencimento: "",
      recorrente: false,
      dia_vencimento: 1,
      observacoes: "",
    },
  });

  const handleCreateHonorario = async (data: any) => {
    try {
      console.log("Criando honorário com dados:", { ...data, processo_id: processoId });
      
      await createHonorario({
        ...data,
        processo_id: processoId,
      });
      
      honorarioForm.reset();
      setIsHonorarioDialogOpen(false);
      toast.success("Honorário criado com sucesso!");
    } catch (error: any) {
      console.error("Erro detalhado ao criar honorário:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        processoId
      });
      toast.error(error.message || "Erro ao criar honorário. Verifique os dados e tente novamente.");
    }
  };

  const handleCreateItem = async (data: any) => {
    if (!selectedHonorario) return;
    
    try {
      await createItem({
        ...data,
        honorario_id: selectedHonorario,
      });
      itemForm.reset();
      setIsItemDialogOpen(false);
      toast.success("Item criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar item");
    }
  };

  const handleCreateParcela = async (data: any) => {
    if (!selectedItem) return;
    
    try {
      await createParcela({
        ...data,
        honorario_item_id: selectedItem,
      });
      parcelaForm.reset();
      setIsParcelaDialogOpen(false);
      toast.success("Parcela criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar parcela");
    }
  };

  const handleAprovar = async (honorarioId: string) => {
    if (confirm("Tem certeza que deseja aprovar este honorário?")) {
      try {
        await aprovarHonorario(honorarioId);
        toast.success("Honorário aprovado com sucesso!");
      } catch (error) {
        toast.error("Erro ao aprovar honorário");
      }
    }
  };

  const handleAssinar = async (honorarioId: string) => {
    const nome = prompt("Digite seu nome para assinatura:");
    const email = prompt("Digite seu email:");
    
    if (nome && email) {
      try {
        await assinarHonorario({
          honorarioId,
          nome,
          email,
          metodo: "digital"
        });
        toast.success("Honorário assinado com sucesso!");
      } catch (error) {
        toast.error("Erro ao assinar honorário");
      }
    }
  };

  const handleGerarTitulos = async (honorarioId: string) => {
    if (confirm("Deseja gerar os títulos financeiros para este honorário?")) {
      try {
        const result = await gerarTitulosFinanceiros(honorarioId);
        const totalGerado = typeof result === 'object' && result !== null && 'total_gerado' in result 
          ? (result as any).total_gerado 
          : 'alguns';
        toast.success(`${totalGerado} títulos gerados com sucesso!`);
      } catch (error: any) {
        toast.error(error.message || "Erro ao gerar títulos financeiros");
      }
    }
  };

  const calculateDiferenca = (definido: number, cobrado: number) => {
    return ((cobrado - definido) / definido) * 100;
  };

  const getItensForHonorario = (honorarioId: string) => {
    return itens?.filter(item => item.honorario_id === honorarioId) || [];
  };

  const getParcelasForItem = (itemId: string) => {
    return parcelas?.filter(parcela => parcela.honorario_item_id === itemId) || [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5" />
            Honorários do Processo
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
            <ScaleIcon className="h-5 w-5" />
            Honorários do Processo
          </div>
          <Dialog open={isHonorarioDialogOpen} onOpenChange={setIsHonorarioDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Honorário
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Honorário</DialogTitle>
              </DialogHeader>
              <Form {...honorarioForm}>
                <form onSubmit={honorarioForm.handleSubmit(handleCreateHonorario)} className="space-y-4">
                  <FormField
                    control={honorarioForm.control}
                    name="objeto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objeto *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Ação de cobrança contra João Silva" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={honorarioForm.control}
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
                      onClick={() => setIsHonorarioDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Criando..." : "Criar Honorário"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {honorarios?.length === 0 ? (
          <div className="text-center py-8">
            <ScaleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum honorário cadastrado para este processo.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsHonorarioDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Primeiro Honorário
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {honorarios?.map((honorario: any) => {
              const honorarioItens = getItensForHonorario(honorario.id);
              const totalDefinido = honorarioItens.reduce((acc, item) => acc + (item.valor_definido || 0), 0);
              const totalCobrado = honorarioItens.reduce((acc, item) => acc + (item.valor_cobrado || 0), 0);
              const diferenca = totalDefinido > 0 ? calculateDiferenca(totalDefinido, totalCobrado) : 0;
              const precisaJustificativa = diferenca < -5; // Se cobrado for 5% menor que definido

              return (
                <Card key={honorario.id} className="border-l-4 border-l-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{honorario.objeto}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={statusColors[honorario.status as keyof typeof statusColors]}>
                            {honorario.status}
                          </Badge>
                          {honorario.cha_gerado && (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              CHA Gerado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => deleteHonorario(honorario.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comparativo Definido x Cobrado */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-sm text-muted-foreground">Valor Definido</div>
                        <div className="font-semibold text-lg">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalDefinido)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-sm text-muted-foreground">Valor Cobrado</div>
                        <div className="font-semibold text-lg">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(totalCobrado)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-sm text-muted-foreground">Diferença</div>
                        <div className={`font-semibold text-lg ${diferenca < 0 ? 'text-destructive' : diferenca > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                          {diferenca.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {precisaJustificativa && !honorario.justificativa_diferenca && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          O valor cobrado está significativamente abaixo do valor definido. 
                          É recomendado adicionar uma justificativa conforme Tabela OAB-MG 2023.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Itens por Tipo */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Itens de Honorários</h5>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedHonorario(honorario.id);
                            setIsItemDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Item
                        </Button>
                      </div>

                      {honorarioItens.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Nenhum item cadastrado
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {honorarioItens.map((item: any) => {
                            const itemParcelas = getParcelasForItem(item.id);
                            const totalParcelas = itemParcelas.reduce((acc, p) => acc + p.valor, 0);

                            return (
                              <Card key={item.id} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={tipoColors[item.tipo as keyof typeof tipoColors]}>
                                        {tipoLabels[item.tipo as keyof typeof tipoLabels]}
                                      </Badge>
                                    </div>
                                    <h6 className="font-medium mt-1">{item.descricao}</h6>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedItem(item.id);
                                      setIsParcelaDialogOpen(true);
                                    }}
                                    className="gap-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Parcela
                                  </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Definido:</span>
                                    <span className="font-medium ml-1">
                                      {item.tipo === 'exito' ? 
                                        `${item.percentual_exito || 0}%` :
                                        new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL'
                                        }).format(item.valor_definido || 0)
                                      }
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Cobrado:</span>
                                    <span className="font-medium ml-1">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(item.valor_cobrado || 0)}
                                    </span>
                                  </div>
                                </div>

                                {itemParcelas.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-xs text-muted-foreground mb-1">
                                      {itemParcelas.length} parcela(s) - Total: {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                      }).format(totalParcelas)}
                                    </div>
                                    <div className="space-y-1">
                                      {itemParcelas.slice(0, 3).map((parcela: any) => (
                                        <div key={parcela.id} className="flex justify-between text-xs">
                                          <span>Parcela {parcela.numero_parcela}</span>
                                          <span>{new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</span>
                                          <span className="font-medium">
                                            {new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL'
                                            }).format(parcela.valor)}
                                          </span>
                                        </div>
                                      ))}
                                      {itemParcelas.length > 3 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{itemParcelas.length - 3} parcela(s)
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Ações do Honorário */}
                    <div className="flex gap-2 mt-6 pt-4 border-t">
                      {honorario.status === 'rascunho' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAprovar(honorario.id)}
                          disabled={isUpdating || !honorario.cha_gerado}
                          className="gap-2"
                        >
                          <Check className="h-4 w-4" />
                          Aprovar
                        </Button>
                      )}
                      
                      {honorario.status === 'aprovado' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAssinar(honorario.id)}
                          disabled={isUpdating}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Assinar
                        </Button>
                      )}
                      
                      {honorario.status === 'assinado' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGerarTitulos(honorario.id)}
                          disabled={isGeneratingTitulos}
                          className="gap-2"
                        >
                          <DollarSign className="h-4 w-4" />
                          {isGeneratingTitulos ? "Gerando..." : "Gerar Títulos"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog para adicionar Item */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item de Honorário</DialogTitle>
            </DialogHeader>
            <Form {...itemForm}>
              <form onSubmit={itemForm.handleSubmit(handleCreateItem)} className="space-y-4">
                <FormField
                  control={itemForm.control}
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
                          <SelectItem value="inicial">Inicial</SelectItem>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="exito">Êxito</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Honorários iniciais para petição" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={itemForm.control}
                    name="valor_definido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Definido</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={itemForm.control}
                    name="valor_cobrado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Cobrado</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsItemDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Item
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog para adicionar Parcela */}
        <Dialog open={isParcelaDialogOpen} onOpenChange={setIsParcelaDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Parcela</DialogTitle>
            </DialogHeader>
            <Form {...parcelaForm}>
              <form onSubmit={parcelaForm.handleSubmit(handleCreateParcela)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={parcelaForm.control}
                    name="numero_parcela"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Parcela</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={parcelaForm.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={parcelaForm.control}
                  name="data_vencimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsParcelaDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Parcela
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}