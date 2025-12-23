import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCnpjPj } from "@/hooks/useCnpjPj";
import { useContatoCompleto } from "@/hooks/useContatoCompleto";
import { Loader2, Save, Search } from "lucide-react";
import { PJTab } from "./tabs/PJTab";

const contatoSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório"),
  cpf_cnpj: z.string().min(11, "CPF/CNPJ inválido"),
  tipo: z.enum(["PF", "PJ"]),
  celular: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  nome_fantasia: z.string().optional(),
  regime_tributario: z.string().optional(),
  inscricao_estadual: z.string().optional(),
}).refine((data) => {
  if (data.tipo === 'PJ') {
    return !!data.celular || !!data.telefone || !!data.email;
  }
  return !!data.celular;
}, {
  message: "Informe ao menos um meio de contato (Celular, Telefone ou E-mail)",
  path: ["celular"],
});

type ContatoFormValues = z.infer<typeof contatoSchema>;

export function ContatoFormulario() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { consultarCNPJ, isLoading: loadingCNPJ } = useCnpjPj();
  const { createContato, loading: loadingContato } = useContatoCompleto();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");

  const form = useForm<ContatoFormValues>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      tipo: "PF",
      nome: "",
      cpf_cnpj: "",
      celular: "",
      email: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
    }
  });

  const tipoContato = form.watch("tipo");

  const handleBuscarCNPJ = async () => {
    const cnpj = form.getValues("cpf_cnpj");
    const tipo = form.getValues("tipo");

    if (tipo === 'PJ' && cnpj && cnpj.length >= 14) {
      console.log("Iniciando busca CNPJ:", cnpj);
      
      const dados = await consultarCNPJ(cnpj);
      
      if (dados) {
        form.setValue("nome", dados.razao_social, { shouldValidate: true });
        form.setValue("nome_fantasia", dados.nome_fantasia, { shouldValidate: true });
        form.setValue("telefone", dados.telefone);
        form.setValue("email", dados.email);
        form.setValue("regime_tributario", dados.regime_tributario);
        
        form.setValue("cep", dados.cep);
        form.setValue("logradouro", dados.logradouro);
        form.setValue("numero", dados.numero);
        form.setValue("bairro", dados.bairro);
        form.setValue("cidade", dados.municipio);
        form.setValue("estado", dados.uf);

        toast({ 
          title: "Dados Carregados", 
          description: "Formulário preenchido com dados da Receita Federal." 
        });
      }
    }
  };

  const onSubmit = async (values: ContatoFormValues) => {
    if (isSaving || loadingContato) return;
    setIsSaving(true);

    try {
      // Preparar meios de contato
      const meiosContato = [];
      if (values.email) {
        meiosContato.push({ tipo: 'Email', valor: values.email, principal: true });
      }
      if (values.celular) {
        meiosContato.push({ tipo: 'Celular', valor: values.celular, principal: !values.email });
      }
      if (values.telefone) {
        meiosContato.push({ tipo: 'Telefone', valor: values.telefone, principal: false });
      }

      // Preparar endereços
      const enderecos = [];
      if (values.logradouro || values.cep) {
        enderecos.push({
          tipo: 'Comercial',
          principal: true,
          cep: values.cep || '',
          logradouro: values.logradouro || '',
          numero: values.numero || '',
          bairro: values.bairro || '',
          cidade: values.cidade || '',
          uf: values.estado || '',
        });
      }

      // Preparar dados PJ se for PJ
      let dadosPj = null;
      if (values.tipo === 'PJ' && values.cpf_cnpj) {
        dadosPj = {
          razao_social: values.nome,
          cnpj: values.cpf_cnpj.replace(/\D/g, ''),
          nome_fantasia: values.nome_fantasia || null,
          regime_tributario: values.regime_tributario || null,
          inscricao_estadual: values.inscricao_estadual || null,
        };
      }

      // Criar contato usando RPC function
      const result = await createContato({
        nome: values.nome,
        cpf_cnpj: values.cpf_cnpj || null,
        meios_contato: meiosContato.length > 0 ? meiosContato : undefined,
        enderecos: enderecos.length > 0 ? enderecos : undefined,
        dados_pj: dadosPj,
      });

      if (result) {
        toast({ title: "Sucesso", description: "Contato salvo com sucesso!" });
        navigate(`/contatos/${result.id}`);
      }
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao salvar contato.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-card rounded-lg border">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pessoa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Apenas números" 
                        onBlur={() => {
                          field.onBlur();
                          handleBuscarCNPJ();
                        }}
                      />
                    </FormControl>
                    {tipoContato === 'PJ' && (
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="outline" 
                        onClick={handleBuscarCNPJ}
                        disabled={loadingCNPJ}
                        title="Consultar na Receita"
                      >
                        {loadingCNPJ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo / Razão Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular / WhatsApp</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
            {tipoContato === 'PJ' && <TabsTrigger value="pj">Dados PJ</TabsTrigger>}
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
             <div className="p-4 border rounded-md bg-muted/20 text-sm text-muted-foreground">
                Preencha os campos acima.
             </div>
          </TabsContent>

          <TabsContent value="pj">
            <PJTab form={form} onConsultarRF={handleBuscarCNPJ} loading={loadingCNPJ} />
          </TabsContent>

          <TabsContent value="endereco">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                <FormField control={form.control} name="cep" render={({field}) => (
                   <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="logradouro" render={({field}) => (
                   <FormItem className="md:col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="numero" render={({field}) => (
                   <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="bairro" render={({field}) => (
                   <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="cidade" render={({field}) => (
                   <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="estado" render={({field}) => (
                   <FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
             </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancelar</Button>
          <Button type="submit" disabled={isSaving || loadingContato}>
            {(isSaving || loadingContato) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Contato
          </Button>
        </div>
      </form>
    </Form>
  );
}
