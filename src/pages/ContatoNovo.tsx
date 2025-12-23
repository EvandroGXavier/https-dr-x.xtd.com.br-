import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCpfCnpj } from "@/hooks/useCpfCnpj";
import { useCnpjPj } from "@/hooks/useCnpjPj";
import { useContatoCompleto } from "@/hooks/useContatoCompleto";
import { formatPhone } from "@/lib/formatters";
import { usePreenchimentoIAStore } from "@/store/preenchimento-ia";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema com validação condicional: Celular opcional se houver Telefone ou Email
const novoContatoSchema = z.object({
  nome_fantasia: z.string().min(1, 'Nome Fantasia é obrigatório'),
  celular: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cpf_cnpj: z.string().optional(),
  observacao: z.string().optional(),
  // Campos de Endereço
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  // Campos PJ
  razao_social: z.string().optional(),
  regime_tributario: z.string().optional(),
  inscricao_estadual: z.string().optional(),
}).refine((data) => {
  // Regra: Aceita ter apenas Telefone ou Email se não tiver Celular
  return !!data.celular || !!data.telefone || !!data.email;
}, {
  message: "Informe ao menos um meio de contato (Celular, Telefone ou E-mail)",
  path: ["celular"],
});

type NovoContatoData = z.infer<typeof novoContatoSchema>;

export default function ContatoNovo() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dadosPreenchidosIA, setDadosPreenchidosIA] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const cnpjPjHook = useCnpjPj();
  const { createContato, loading: loadingContato } = useContatoCompleto();
  const { consumirDados } = usePreenchimentoIAStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<NovoContatoData>({
    resolver: zodResolver(novoContatoSchema),
  });

  const cpfCnpjValue = watch('cpf_cnpj') || '';
  const cpfCnpj = useCpfCnpj(cpfCnpjValue);

  // Consome dados da IA ao carregar a página
  useEffect(() => {
    const dadosIA = consumirDados();
    if (dadosIA && (dadosIA.tipo === 'contato_pf' || dadosIA.tipo === 'contato_pj')) {
      const dados = dadosIA.dados;
      
      // Mapeamento para Pessoa Física
      if (dadosIA.tipo === 'contato_pf') {
        if (dados.nome_completo) setValue('nome_fantasia', dados.nome_completo);
        if (dados.cpf) setValue('cpf_cnpj', dados.cpf);
        
        setDadosPreenchidosIA(true);
        
        toast({
          title: 'Dados preenchidos automaticamente',
          description: 'Os dados do documento foram carregados. Revise e adicione informações de contato.',
        });
      }
      
      // Mapeamento para Pessoa Jurídica
      if (dadosIA.tipo === 'contato_pj') {
        if (dados.razao_social) setValue('nome_fantasia', dados.razao_social);
        else if (dados.nome_fantasia) setValue('nome_fantasia', dados.nome_fantasia);
        if (dados.cnpj) setValue('cpf_cnpj', dados.cnpj);
        
        setDadosPreenchidosIA(true);
        
        toast({
          title: 'Dados preenchidos automaticamente',
          description: 'Os dados da empresa foram carregados. Revise e adicione informações de contato.',
        });
      }
    }
  }, [consumirDados, setValue, toast]);

  // Auto-lookup CNPJ when valid - REMOVIDO porque o hook consultarCnpj precisa de contatoId e tenantId
  // A consulta será feita manualmente após criar o contato ou através de botão

  const onSubmit = async (data: NovoContatoData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar meios de contato
      const meiosContato = [];
      if (data.email) {
        meiosContato.push({ tipo: 'Email', valor: data.email, principal: true });
      }
      if (data.celular) {
        meiosContato.push({ tipo: 'Celular', valor: data.celular, principal: true });
      }
      if (data.telefone) {
        meiosContato.push({ tipo: 'Telefone', valor: data.telefone, principal: false });
      }

      // Preparar endereços se houver dados
      const enderecos = [];
      if (data.logradouro || data.cep) {
        enderecos.push({
          tipo: 'Comercial',
          principal: true,
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
        });
      }

      // Preparar dados PJ se for CNPJ válido
      let dadosPj = null;
      if (data.cpf_cnpj && cpfCnpj.kind === 'cnpj' && cpfCnpj.isValid) {
        dadosPj = {
          razao_social: data.razao_social || data.nome_fantasia,
          cnpj: cpfCnpj.raw,
          regime_tributario: data.regime_tributario || null,
          inscricao_estadual: data.inscricao_estadual || null,
        };
      }

      // Criar contato usando RPC function
      const result = await createContato({
        nome: data.nome_fantasia,
        cpf_cnpj: data.cpf_cnpj || null,
        observacao: data.observacao || null,
        meios_contato: meiosContato,
        enderecos: enderecos.length > 0 ? enderecos : undefined,
        dados_pj: dadosPj,
      });

      if (result) {
        toast({ title: "Sucesso", description: "Contato criado com sucesso!" });
        navigate(`/contatos/${result.id}`);
      }
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSaveAndExit = async (data: NovoContatoData) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar meios de contato
      const meiosContato = [];
      if (data.email) {
        meiosContato.push({ tipo: 'Email', valor: data.email, principal: true });
      }
      if (data.celular) {
        meiosContato.push({ tipo: 'Celular', valor: data.celular, principal: true });
      }
      if (data.telefone) {
        meiosContato.push({ tipo: 'Telefone', valor: data.telefone, principal: false });
      }

      // Preparar endereços se houver dados
      const enderecos = [];
      if (data.logradouro || data.cep) {
        enderecos.push({
          tipo: 'Comercial',
          principal: true,
          cep: data.cep || '',
          logradouro: data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || '',
          uf: data.uf || '',
        });
      }

      // Preparar dados PJ se for CNPJ válido
      let dadosPj = null;
      if (data.cpf_cnpj && cpfCnpj.kind === 'cnpj' && cpfCnpj.isValid) {
        dadosPj = {
          razao_social: data.razao_social || data.nome_fantasia,
          cnpj: cpfCnpj.raw,
          regime_tributario: data.regime_tributario || null,
          inscricao_estadual: data.inscricao_estadual || null,
        };
      }

      // Criar contato usando RPC function
      const result = await createContato({
        nome: data.nome_fantasia,
        cpf_cnpj: data.cpf_cnpj || null,
        observacao: data.observacao || null,
        meios_contato: meiosContato,
        enderecos: enderecos.length > 0 ? enderecos : undefined,
        dados_pj: dadosPj,
      });

      if (result) {
        toast({ title: "Sucesso", description: "Contato criado com sucesso!" });
        navigate("/contatos");
      }
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contato",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contatos")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Contato</h1>
        </div>

        {/* Alerta de preenchimento por IA */}
        {dadosPreenchidosIA && (
          <Alert className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-950/20 dark:to-orange-950/20">
            <Sparkles className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Dados preenchidos automaticamente pela IA. Revise as informações e adicione dados de contato (telefone/email) antes de salvar.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              {/* Primeira linha: Nome Fantasia, Celular, Telefone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
                  <Input
                    id="nome_fantasia"
                    {...register('nome_fantasia')}
                    placeholder="Nome fantasia"
                    className={errors.nome_fantasia ? 'border-destructive' : ''}
                    autoFocus
                  />
                  {errors.nome_fantasia && (
                    <p className="text-sm text-destructive">{errors.nome_fantasia.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular">Celular *</Label>
                  <Input
                    id="celular"
                    {...register('celular')}
                    placeholder="(11) 99999-9999"
                    className={errors.celular ? 'border-destructive' : ''}
                    onBlur={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('celular', formatted);
                    }}
                  />
                  {errors.celular && (
                    <p className="text-sm text-destructive">{errors.celular.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder="(11) 3333-4444"
                    onBlur={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setValue('telefone', formatted);
                    }}
                  />
                </div>
              </div>

              {/* Segunda linha: E-mail, CPF/CNPJ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@exemplo.com"
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <div className="relative">
                    <Input
                      id="cpf_cnpj"
                      {...register('cpf_cnpj')}
                      value={cpfCnpj.masked}
                      onChange={(e) => setValue('cpf_cnpj', e.target.value)}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  </div>
                  {cpfCnpj.kind === 'cnpj' && !cpfCnpj.isValid && cpfCnpj.raw.length === 14 && (
                    <p className="text-xs text-destructive">CNPJ inválido</p>
                  )}
                  {cpfCnpj.kind === 'cpf' && !cpfCnpj.isValid && cpfCnpj.raw.length === 11 && (
                    <p className="text-xs text-destructive">CPF inválido</p>
                  )}
                </div>
              </div>

              {/* Terceira linha: Observações (5 linhas, ocupando todas as colunas) */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observações</Label>
                <Textarea
                  id="observacao"
                  {...register('observacao')}
                  placeholder="Observações sobre o contato"
                  rows={5}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || loadingContato}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSubmit(onSaveAndExit)}
                  disabled={isSubmitting || loadingContato}
                  variant="outline"
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Salvar e Sair
                </Button>
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/contatos")}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}