import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X, AlertCircle, Save, XIcon, Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useProcessos, useProcesso } from "@/hooks/useProcessos";
import { useContatos } from "@/hooks/useContatos";
import { useGlobalSave } from "@/hooks/useGlobalSave";
import { ProcessoUploader } from "./ProcessoUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DocsList } from "@/components/docs/DocsList";
import { ProcessoPartes } from "./ProcessoPartes";
import { ProcessoMovimentacoes } from "./ProcessoMovimentacoes";
import { ProcessoContratos } from "./ProcessoContratos";
import { ProcessoHonorarios } from "./ProcessoHonorarios";
import { ProcessoAgenda } from "./ProcessoAgenda";
import { ProcessoFinanceiro } from "./ProcessoFinanceiro";
import { ProcessoDesdobramentos } from "./ProcessoDesdobramentos";
import { ProcessoEtiquetas } from "./ProcessoEtiquetas";
import { ProcessoTimeline } from "./ProcessoTimeline";

// Opções de etiquetas
const etiquetas = [
  "extrajudicial",
  "judicial",
  "administrativo",
  "interno"
];

// Opções de situações
const situacoes = [
  "Em Andamento",
  "Arquivado",
  "Encerrado",
  "Suspenso"
];

// Schema de validação
const schema = z.object({
  etiqueta: z.string().optional(),
  assunto_principal: z.string().min(1, "Título é obrigatório"),
  tipo_acao: z.string().optional(),
  cliente_principal_id: z.string().optional(),
  qualificacao: z.string().optional(),
  numero_processo: z.string().optional(),
  parte_contraria_id: z.string().optional(),
  advogado_id: z.string().optional(),
  juiz_id: z.string().optional(),
  numero_pasta: z.string().optional(),
  detalhes_pasta: z.string().optional(),
  advogado_responsavel: z.string().optional(),
  push_andamentos: z.string().optional(),
  status_push: z.string().optional(),
  tribunal_orgao: z.string().optional(),
  uf: z.string().optional(),
  localidade: z.string().optional(),
  instancia: z.string().optional(),
  vara_turma: z.string().optional(),
  juiz: z.string().optional(),
  contrato: z.string().optional(),
  risco: z.string().optional(),
  valor_causa: z.string().optional(),
  valor_possivel: z.string().optional(),
  valor_provisionado: z.string().optional(),
  observacoes: z.string().optional(),
  data_distribuicao: z.date().optional(),
  situacao: z.string().default("Em Andamento"),
});

type FormData = z.infer<typeof schema>;

interface ProcessoEnhancedFormProps {
  processoId?: string;
  onSuccess?: (processoId: string) => void;
  onSave?: (processoId: string) => void;
  onSaveAndExit?: (processoId: string) => void;
}

// Helper para converter valores monetários (R$ 1.000,00 -> 1000.00)
const parseCurrency = (value: string | undefined | number) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  // Remove tudo que não é dígito, vírgula ou ponto, substitui vírgula por ponto
  const cleanStr = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleanStr) || 0;
};

export function ProcessoEnhancedForm({ processoId, onSuccess, onSave, onSaveAndExit }: ProcessoEnhancedFormProps) {
  const navigate = useNavigate();
  const { createProcesso, updateProcesso, isCreating, isUpdating } = useProcessos();
  const { processo, isLoading } = useProcesso(processoId);
  const isProcessing = false;
  const { contacts } = useContatos();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [showOCRPreview, setShowOCRPreview] = useState(false);
  const [ocrData, setOCRData] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      etiqueta: "extrajudicial",
      situacao: "Em Andamento",
      qualificacao: "Autor",
      push_andamentos: "Não",
      uf: "MG",
      localidade: "Betim",
      instancia: "1ª",
      numero_pasta: "0",
      valor_causa: "0,00",
      valor_possivel: "0,00",
      valor_provisionado: "0,00",
      assunto_principal: "",
      tipo_acao: "",
      cliente_principal_id: "",
      numero_processo: "",
      parte_contraria_id: "",
      advogado_id: "",
      juiz_id: "",
      detalhes_pasta: "",
      advogado_responsavel: "",
      status_push: "",
      tribunal_orgao: "",
      vara_turma: "",
      juiz: "",
      contrato: "",
      risco: "",
      observacoes: ""
    },
  });

  const selectedEtiqueta = form.watch("etiqueta");

  // Preenchimento do formulário ao carregar (Modo Edição)
  useEffect(() => {
    if (processo?.processo_data) {
      const p = processo.processo_data as any;

      // Helper para formatar valores monetários do banco para o form
      const formatCurrency = (val: number | null | undefined) =>
        val ? String(val).replace('.', ',') : "0,00";

      form.reset({
        // Mapeamento Inverso: Banco -> Formulário
        assunto_principal: p.titulo || "",
        situacao: p.status || "Em Andamento",

        numero_processo: p.numero_processo || "",
        numero_pasta: p.pasta || "0",
        tipo_acao: p.tipo_acao || "",
        detalhes_pasta: p.descricao || "",

        cliente_principal_id: p.cliente_id || "",
        parte_contraria_id: p.parte_contraria_id || "",
        advogado_id: p.advogado_id || "",

        localidade: p.local || "Betim",
        uf: p.uf || "MG",
        instancia: p.instancia || "1ª",
        vara_turma: p.vara || "",
        tribunal_orgao: p.tribunal_orgao || "",

        valor_causa: formatCurrency(p.valor_causa),
        valor_possivel: formatCurrency(p.valor_possivel),
        valor_provisionado: formatCurrency(p.valor_provisionado),

        data_distribuicao: p.data_distribuicao ? new Date(p.data_distribuicao) : undefined,
        observacoes: p.observacoes || "",

        // Campos com valores padrão
        etiqueta: "judicial",
        qualificacao: "Autor",
        push_andamentos: "Não",
        status_push: "",
        juiz_id: "",
        contrato: "",
        risco: "",
        juiz: "",
        advogado_responsavel: "",
      });
    }
  }, [processo, form]);


  const onSubmit = async (data: FormData) => {
    try {
      console.log("🚀 Iniciando salvamento...", data);

      // Mapeamento: Formulário (Zod) -> Banco de Dados (Supabase)
      // Estamos lidando com a tabela 'processos' aqui (Stage 1)
      const payload: any = {
        // Campos Obrigatórios
        titulo: data.assunto_principal,
        status: data.situacao || "ativo",

        // Campos de Identificação
        numero_processo: data.numero_processo || null,
        pasta: data.numero_pasta || null,
        tipo_acao: data.tipo_acao || null,
        descricao: data.detalhes_pasta || null,

        // Relacionamentos (IDs)
        cliente_id: data.cliente_principal_id || null,
        parte_contraria_id: data.parte_contraria_id || null,
        advogado_id: data.advogado_id || null,

        // Localização / Jurídico
        local: data.localidade || null,
        uf: data.uf || null,
        instancia: data.instancia || null,
        vara: data.vara_turma || null,

        // Tribunal e Comarca (para processos_tj via RPC)
        tribunal_orgao: data.tribunal_orgao || null,
        comarca: data.localidade || null, // comarca = localidade

        // Financeiro (Valores do Cabeçalho)
        valor_causa: parseCurrency(data.valor_causa),
        valor_possivel: parseCurrency(data.valor_possivel),
        valor_provisionado: parseCurrency(data.valor_provisionado),

        // Datas
        data_distribuicao: data.data_distribuicao ? data.data_distribuicao.toISOString() : null,

        // Extras
        observacoes: data.observacoes || null,
      };

      if (processoId) {
        // --- EDIÇÃO ---
        console.log("📝 Atualizando processo existente:", payload);
        await updateProcesso({
          id: processoId,
          ...payload
        });

        if (onSave) onSave(processoId);
        toast.success("Processo atualizado com sucesso!");
      } else {
        // --- CRIAÇÃO ---
        console.log("✨ Criando novo processo:", payload);
        const novoProcesso = await createProcesso(payload);

        // Redirecionamento vital para ativar o Stage 2
        if (onSuccess) {
          onSuccess(novoProcesso.id);
        } else if (onSaveAndExit) {
          onSaveAndExit(novoProcesso.id);
        }
        toast.success("Processo criado! Redirecionando para detalhes...");
      }
    } catch (error: any) {
      console.error("❌ Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar processo. Verifique os campos obrigatórios.");
    }
  };

  const handleUploaderSuccess = async (files: FileList) => {
    if (!files || files.length === 0) return;

    toast.success("Arquivo carregado", {
      description: `${files[0].name} foi carregado com sucesso!`,
    });
  };

  const applyOCRData = () => {
    if (!ocrData) return;

    if (ocrData.numero_processo) {
      form.setValue('numero_processo', ocrData.numero_processo);
    }

    setShowOCRPreview(false);
    toast.success("Dados aplicados", {
      description: "Os dados extraídos foram aplicados ao formulário.",
    });
  };

  const getRequiredFields = (etiqueta: string) => {
    switch (etiqueta) {
      case 'Judicial':
        return ['numero_processo', 'data_distribuicao', 'situacao'];
      case 'Extrajudicial':
        return ['cliente_principal_id'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Header com Botões */}
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-xl font-semibold text-foreground">CADASTRO DE PROCESSOS</h2>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {(isCreating || isUpdating) ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isCreating || isUpdating}
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) {
                    const data = form.getValues();
                    await onSubmit(data);
                    if (onSaveAndExit) onSaveAndExit(processoId || '');
                  }
                }}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Salvar e Sair
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/processos")}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <XIcon className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="principal" className="w-full">
            <TabsList className="grid w-full grid-cols-11 bg-muted">
              <TabsTrigger value="principal">Principal</TabsTrigger>
              <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="agenda">Agenda</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="anexos">Anexos</TabsTrigger>
              <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
              <TabsTrigger value="partes">Partes</TabsTrigger>
              <TabsTrigger value="andamentos">Andamentos</TabsTrigger>
              <TabsTrigger value="publicacoes">Publicações</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Aba Principal */}
            <TabsContent value="principal" className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Primeira linha */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="etiqueta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">TIPO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Extrajudicial" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {etiquetas.map((etiqueta) => (
                                <SelectItem key={etiqueta} value={etiqueta}>
                                  {etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assunto_principal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">
                            TÍTULO <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Digite o título do processo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipo_acao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">TIPO DE AÇÃO/ASSUNTO</FormLabel>
                          <FormControl>
                            <Input placeholder="Ação Rescisória" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Segunda linha */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="cliente_principal_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">CLIENTE</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts?.map((contato) => (
                                <SelectItem key={contato.id} value={contato.id}>
                                  {contato.nome_fantasia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="qualificacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">QUALIFICAÇÃO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Autor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Autor">Autor</SelectItem>
                              <SelectItem value="Réu">Réu</SelectItem>
                              <SelectItem value="Terceiro">Terceiro</SelectItem>
                              <SelectItem value="Assistente">Assistente</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_processo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">
                            NÚMERO {getRequiredFields(selectedEtiqueta).includes('numero_processo') && <span className="text-destructive">*</span>}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="0000000-00.0000.0.00.0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <FormLabel className="text-sm font-medium text-muted-foreground">ÁREA</FormLabel>
                      <Select defaultValue="Trabalhista">
                        <SelectTrigger>
                          <SelectValue placeholder="Trabalhista" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Trabalhista">Trabalhista</SelectItem>
                          <SelectItem value="Civil">Civil</SelectItem>
                          <SelectItem value="Criminal">Criminal</SelectItem>
                          <SelectItem value="Tributário">Tributário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Terceira linha */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="parte_contraria_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">CONTRÁRIO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o contrário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts?.map((contato) => (
                                <SelectItem key={contato.id} value={contato.id}>
                                  {contato.nome_fantasia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_pasta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">Nº PASTA</FormLabel>
                          <FormControl>
                            <Input placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="detalhes_pasta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">DETALHES DA PASTA</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detalhes da pasta" className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quarta linha */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="advogado_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">ADVOGADO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o advogado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts?.map((contato) => (
                                <SelectItem key={contato.id} value={contato.id}>
                                  {contato.nome_fantasia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="push_andamentos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">PUSH ANDAMENTOS</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Não" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Sim">Sim</SelectItem>
                              <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status_push"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">STATUS PUSH</FormLabel>
                          <FormControl>
                            <Input placeholder="Status" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tribunal_orgao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">TRIBUNAL / ÓRGÃO</FormLabel>
                          <FormControl>
                            <Input placeholder="Tribunal" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quinta linha */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">UF</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="MG" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MG">MG</SelectItem>
                              <SelectItem value="SP">SP</SelectItem>
                              <SelectItem value="RJ">RJ</SelectItem>
                              <SelectItem value="RS">RS</SelectItem>
                              <SelectItem value="PR">PR</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="localidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">LOCALIDADE</FormLabel>
                          <FormControl>
                            <Input placeholder="Betim" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instancia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">INSTÂNCIA</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="1ª" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1ª">1ª</SelectItem>
                              <SelectItem value="2ª">2ª</SelectItem>
                              <SelectItem value="3ª">3ª</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vara_turma"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">VARA / TURMA</FormLabel>
                          <FormControl>
                            <Input placeholder="Vara" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="juiz_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">JUIZ</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o juiz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contacts?.map((contato) => (
                                <SelectItem key={contato.id} value={contato.id}>
                                  {contato.nome_fantasia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sexta linha */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <FormField
                      control={form.control}
                      name="contrato"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">CONTRATO</FormLabel>
                          <FormControl>
                            <Input placeholder="Contrato" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="risco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">RISCO</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Baixo">Baixo</SelectItem>
                              <SelectItem value="Médio">Médio</SelectItem>
                              <SelectItem value="Alto">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_causa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">R$ CAUSA</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_possivel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">R$ POSSÍVEL</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_provisionado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-muted-foreground">R$ PROVISIONADO</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button type="button" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Mais informações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GED Tab - Sistema de Anexos */}
            <TabsContent value="anexos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Anexos e Documentos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload de Documentos com OCR */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Upload de Documentos (OCR)</h3>
                    <ProcessoUploader
                      onFilesSelected={handleUploaderSuccess}
                      isProcessing={isProcessing}
                      disabled={isCreating || isUpdating}
                    />
                  </div>

                  {/* Sistema de Captura Universal - Ctrl+V */}
                  {processoId && (
                    <div className="space-y-6">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Captura Rápida (Ctrl+V)</h4>
                        <p className="text-sm text-muted-foreground">
                          Copie qualquer conteúdo (imagens, texto, arquivos) e pressione Ctrl+V para adicionar ao processo.
                        </p>
                      </div>

                      <DocsList
                        vinculoTipo="processo"
                        vinculoId={processoId}
                      />
                    </div>
                  )}

                  {!processoId && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Salve o processo primeiro para habilitar o sistema de anexos.
                      </p>
                    </div>
                  )}

                  {/* Preview dos dados extraídos do OCR */}
                  {showOCRPreview && ocrData && (
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader>
                        <CardTitle className="text-blue-700">Dados Extraídos - OCR</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries(ocrData).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="font-medium">{key}:</span>
                            <span className="text-blue-600">{String(value)}</span>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-4">
                          <Button
                            type="button"
                            onClick={applyOCRData}
                            variant="default"
                            size="sm"
                          >
                            Aplicar Dados
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setShowOCRPreview(false)}
                            variant="outline"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outras abas vazias por enquanto */}
            <TabsContent value="pedidos">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Aba Pedidos em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financeiro">
              {processoId ? (
                <ProcessoFinanceiro processoId={processoId} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Salve o processo primeiro para gerenciar informações financeiras.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="agenda">
              {processoId ? (
                <ProcessoAgenda processoId={processoId} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Salve o processo primeiro para gerenciar a agenda.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documentos">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Aba Documentos em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mensagens">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Aba Mensagens em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="partes">
              {processoId ? (
                <ProcessoPartes processoId={processoId} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Salve o processo primeiro para adicionar partes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="andamentos">
              {processoId ? (
                <ProcessoMovimentacoes processoId={processoId} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Salve o processo primeiro para adicionar movimentações.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="publicacoes">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">Aba Publicações em desenvolvimento...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              {processoId ? (
                <ProcessoTimeline processoId={processoId} />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Salve o processo primeiro para visualizar a timeline.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="text-xs text-muted-foreground text-center">
            * CAMPOS OBRIGATÓRIOS | Pressione Ctrl+S para salvar rapidamente
          </div>
        </form>
      </Form>
    </div>
  );
}