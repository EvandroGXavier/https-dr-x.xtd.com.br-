import { useEffect } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { ContatoCompleto, ContatoPJ } from "@/types/contatos";
import { useCnpjPj } from "@/hooks/useCnpjPj";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interface para modo novo (com form do pai)
interface PJTabPropsNew {
  form: UseFormReturn<any>;
  onConsultarRF: () => void;
  loading?: boolean;
}

// Interface para modo antigo (standalone)
interface PJTabPropsOld {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

type PJTabProps = PJTabPropsNew | PJTabPropsOld;

// Type guard para verificar qual interface está sendo usada
function isNewMode(props: PJTabProps): props is PJTabPropsNew {
  return 'form' in props;
}

export function PJTab(props: PJTabProps) {
  const { toast } = useToast();
  
  // Se for modo antigo, usar lógica standalone
  if (!isNewMode(props)) {
    const { contato, onUpdate } = props;
    const { consultarCNPJ, isLoading: loadingCnpj } = useCnpjPj();
    
    const form = useForm({
      defaultValues: {
        razao_social: contato.pessoa_juridica?.razao_social || contato.nome || '',
        nome_fantasia: contato.pessoa_juridica?.nome_fantasia || contato.nome_fantasia || '',
        natureza_juridica: contato.pessoa_juridica?.natureza_juridica || '',
        porte: contato.pessoa_juridica?.porte || '',
        data_abertura: contato.pessoa_juridica?.data_abertura || '',
        regime_tributario: contato.pessoa_juridica?.regime_tributario || '',
        cnae_principal: contato.pessoa_juridica?.cnae_principal || '',
        cnaes_secundarios: contato.pessoa_juridica?.cnaes_secundarios?.join('\n') || '',
        capital_social: contato.pessoa_juridica?.capital_social?.toString() || '',
        situacao_cadastral: contato.pessoa_juridica?.situacao_cadastral || '',
        situacao_data: contato.pessoa_juridica?.situacao_data || '',
        situacao_motivo: contato.pessoa_juridica?.situacao_motivo || '',
        matriz_filial: contato.pessoa_juridica?.matriz_filial || '',
      }
    });

    const handleConsultarRF = async () => {
      const cnpj = contato.cpf_cnpj?.replace(/\D/g, '');
      if (!cnpj || cnpj.length !== 14) {
        toast({
          title: "CNPJ inválido",
          description: "Por favor, preencha um CNPJ válido na aba Contato",
          variant: "destructive",
        });
        return;
      }
      
      const dados = await consultarCNPJ(cnpj);
      if (dados) {
        console.log('Dados recebidos do CNPJ:', dados);
        
        form.setValue('razao_social', dados.razao_social || '');
        form.setValue('nome_fantasia', dados.nome_fantasia || '');
        form.setValue('regime_tributario', dados.regime_tributario || '');
        form.setValue('natureza_juridica', dados.natureza_juridica || '');
        form.setValue('porte', dados.porte || '');
        form.setValue('data_abertura', dados.data_abertura || '');
        form.setValue('cnae_principal', dados.cnae_principal || '');
        form.setValue('situacao_cadastral', dados.situacao || '');
        
        // Salvar automaticamente
        await handleSave(dados);
      }
    };

    const handleSave = async (dadosCnpj?: any) => {
      const values = form.getValues();
      try {
        // Verificar se já existe registro PJ para este contato
        const { data: existingPJ } = await supabase
          .from('contato_pj')
          .select('id')
          .eq('contato_id', contato.id)
          .maybeSingle();

        const pjData: any = {
          razao_social: values.razao_social,
          nome_fantasia: values.nome_fantasia,
          regime_tributario: values.regime_tributario,
          natureza_juridica: values.natureza_juridica,
          porte: values.porte,
          data_abertura: values.data_abertura || null,
          cnae_principal: values.cnae_principal,
          cnaes_secundarios: values.cnaes_secundarios?.split('\n').filter((c: string) => c.trim()) || [],
          capital_social: values.capital_social ? parseFloat(values.capital_social) : null,
          situacao_cadastral: values.situacao_cadastral,
          situacao_data: values.situacao_data || null,
          situacao_motivo: values.situacao_motivo,
          matriz_filial: values.matriz_filial,
        };

        // Adicionar dados da consulta se disponível
        if (dadosCnpj) {
          pjData.cnpj = dadosCnpj.cnpj;
          pjData.municipio_ibge = dadosCnpj.municipio_ibge;
        }

        if (existingPJ) {
          // Atualizar
          const { error } = await supabase
            .from('contato_pj')
            .update(pjData)
            .eq('id', existingPJ.id);
          if (error) throw error;
        } else {
          // Inserir - precisa incluir contato_id e empresa_id
          const { error } = await supabase
            .from('contato_pj')
            .insert({
              ...pjData,
              contato_id: contato.id,
              empresa_id: contato.empresa_id || '',
            });
          if (error) throw error;
        }

        // Atualizar também nome_fantasia no contato principal se veio do CNPJ
        if (dadosCnpj && dadosCnpj.nome_fantasia) {
          await supabase
            .from('contatos_v2')
            .update({ nome_fantasia: dadosCnpj.nome_fantasia })
            .eq('id', contato.id);
        }

        toast({
          title: "Dados salvos",
          description: "Informações PJ atualizadas com sucesso",
        });

        // Atualizar estado local
        onUpdate({
          ...contato,
          nome_fantasia: values.nome_fantasia || contato.nome_fantasia,
          pessoa_juridica: {
            ...(contato.pessoa_juridica || {} as ContatoPJ),
            nome_fantasia: values.nome_fantasia,
            regime_tributario: values.regime_tributario,
            natureza_juridica: values.natureza_juridica,
          }
        });
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as informações",
          variant: "destructive",
        });
      }
    };

    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">
              Preenchimento automático via Receita Federal
            </div>
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              onClick={handleConsultarRF} 
              disabled={loadingCnpj}
            >
              {loadingCnpj ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Consultar Dados na Receita
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="cnpj" className="text-sm font-medium">CNPJ</label>
              <Input
                id="cnpj"
                value={contato.cpf_cnpj || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="razao_social" className="text-sm font-medium">Razão Social *</label>
              <Input
                id="razao_social"
                {...form.register('razao_social')}
                placeholder="Nome empresarial completo"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="nome_fantasia" className="text-sm font-medium">Nome Fantasia</label>
              <Input
                id="nome_fantasia"
                {...form.register('nome_fantasia')}
                placeholder="Como a empresa é conhecida"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="natureza_juridica" className="text-sm font-medium">Natureza Jurídica</label>
              <Input
                id="natureza_juridica"
                {...form.register('natureza_juridica')}
                placeholder="Ex: Associação Privada"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="porte" className="text-sm font-medium">Porte</label>
              <Input
                id="porte"
                {...form.register('porte')}
                placeholder="Ex: DEMAIS"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="data_abertura" className="text-sm font-medium">Data de Abertura</label>
              <Input
                id="data_abertura"
                type="date"
                {...form.register('data_abertura')}
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="regime_tributario" className="text-sm font-medium">Regime Tributário</label>
              <Input
                id="regime_tributario"
                {...form.register('regime_tributario')}
                placeholder="Ex: Simples Nacional, Lucro Real, etc."
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cnae_principal" className="text-sm font-medium">CNAE Principal</label>
              <Input
                id="cnae_principal"
                {...form.register('cnae_principal')}
                placeholder="Código e descrição"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="capital_social" className="text-sm font-medium">Capital Social</label>
              <Input
                id="capital_social"
                {...form.register('capital_social')}
                placeholder="0"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="situacao_cadastral" className="text-sm font-medium">Situação Cadastral</label>
              <Input
                id="situacao_cadastral"
                {...form.register('situacao_cadastral')}
                placeholder="Ex: Ativa"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="situacao_data" className="text-sm font-medium">Data da Situação</label>
              <Input
                id="situacao_data"
                type="date"
                {...form.register('situacao_data')}
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="matriz_filial" className="text-sm font-medium">Matriz/Filial</label>
              <Input
                id="matriz_filial"
                {...form.register('matriz_filial')}
                placeholder="Ex: Matriz"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="cnaes_secundarios" className="text-sm font-medium">CNAEs Secundários</label>
              <textarea
                id="cnaes_secundarios"
                {...form.register('cnaes_secundarios')}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Um CNAE por linha"
                onBlur={() => handleSave()}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="situacao_motivo" className="text-sm font-medium">Motivo da Situação</label>
              <textarea
                id="situacao_motivo"
                {...form.register('situacao_motivo')}
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Detalhes sobre a situação cadastral"
                onBlur={() => handleSave()}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo novo com form do pai
  const { form, onConsultarRF, loading } = props;
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">
                Preenchimento automático via Receita Federal
            </div>
            <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={onConsultarRF} 
                disabled={loading}
            >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Consultar Dados na Receita
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome_fantasia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Como a empresa é conhecida" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inscricao_estadual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inscrição Estadual</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="I.E." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="regime_tributario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regime Tributário</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Simples Nacional, Lucro Presumido" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
