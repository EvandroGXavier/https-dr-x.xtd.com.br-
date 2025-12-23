import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContatoCompleto, ContatoFinanceiroConfig } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { useCtrlS } from '@/hooks/useCtrlS';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CreditCard, DollarSign } from 'lucide-react';

const admSchema = z.object({
  limite_credito: z.string().optional(),
  validade_limite: z.string().optional(),
  forma_pagamento_padrao: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  pix_tipo: z.string().optional(),
  pix_chave: z.string().optional(),
  observacao: z.string().optional(),
});

type ADMFormData = z.infer<typeof admSchema>;

interface ADMTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Boleto',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência',
  'Cheque',
  'Depósito',
  'Outro'
];

const TIPOS_PIX = [
  'CPF',
  'CNPJ',
  'E-mail',
  'Telefone',
  'Chave Aleatória'
];

export function ADMTab({ contato, onUpdate }: ADMTabProps) {
  const [financeiro, setFinanceiro] = useState<ContatoFinanceiroConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<ADMFormData>({
    resolver: zodResolver(admSchema),
    defaultValues: {
      limite_credito: '',
      validade_limite: '',
      forma_pagamento_padrao: '',
      banco: '',
      agencia: '',
      conta: '',
      pix_tipo: '',
      pix_chave: '',
      observacao: '',
    }
  });

  const pixTipo = watch('pix_tipo');

  useEffect(() => {
    loadFinanceiroConfig();
  }, [contato.id]);

  const loadFinanceiroConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contato_financeiro_config')
        .select('*')
        .eq('contato_id', contato.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFinanceiro(data);
        // Preencher formulário
        setValue('limite_credito', data.limite_credito?.toString() || '');
        setValue('validade_limite', data.validade_limite || '');
        setValue('forma_pagamento_padrao', data.forma_pagamento_padrao || '');
        setValue('banco', data.banco || '');
        setValue('agencia', data.agencia || '');
        setValue('conta', data.conta || '');
        setValue('pix_tipo', data.pix_tipo || '');
        setValue('pix_chave', data.pix_chave || '');
        setValue('observacao', data.observacao || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configuração financeira:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ADMFormData) => {
    setSaving(true);
    try {
      const configData = {
        contato_id: contato.id,
        // CORREÇÃO: usar empresa_id como tenant_id, não user_id
        tenant_id: profile?.empresa_id || contato.empresa_id,
        empresa_id: contato.empresa_id,
        filial_id: contato.filial_id,
        limite_credito: data.limite_credito ? parseFloat(data.limite_credito) : null,
        validade_limite: data.validade_limite || null,
        forma_pagamento_padrao: data.forma_pagamento_padrao || null,
        banco: data.banco || null,
        agencia: data.agencia || null,
        conta: data.conta || null,
        pix_tipo: data.pix_tipo || null,
        pix_chave: data.pix_chave || null,
        observacao: data.observacao || null,
      };

      let result;
      if (financeiro) {
        // Atualizar existente
        result = await supabase
          .from('contato_financeiro_config')
          .update(configData)
          .eq('id', financeiro.id)
          .select()
          .single();
      } else {
        // Criar novo
        result = await supabase
          .from('contato_financeiro_config')
          .insert(configData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setFinanceiro(result.data);
      
      // Atualizar o contato principal
      const updatedContato: ContatoCompleto = {
        ...contato,
        financeiro_config: result.data,
      };
      onUpdate(updatedContato);

      toast({
        title: "Sucesso",
        description: "Configuração financeira salva com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração financeira:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração financeira",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // CTRL+S para salvar
  useCtrlS(() => {
    if (isDirty) {
      handleSubmit(onSubmit)();
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Configuração de Crédito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Configuração de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limite_credito">Limite de Crédito</Label>
                <Input
                  id="limite_credito"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('limite_credito')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade_limite">Validade do Limite</Label>
                <Input
                  id="validade_limite"
                  type="date"
                  {...register('validade_limite')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento_padrao">Forma de Pagamento Padrão</Label>
              <Select
                value={watch('forma_pagamento_padrao') || ''}
                onValueChange={(value) => setValue('forma_pagamento_padrao', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((forma) => (
                    <SelectItem key={forma} value={forma}>
                      {forma}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dados Bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  placeholder="Ex: Banco do Brasil"
                  {...register('banco')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agencia">Agência</Label>
                <Input
                  id="agencia"
                  placeholder="0000-0"
                  {...register('agencia')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conta">Conta</Label>
                <Input
                  id="conta"
                  placeholder="00000000-0"
                  {...register('conta')}
                />
              </div>
            </div>

            {/* PIX */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pix_tipo">Tipo de Chave PIX</Label>
                <Select
                  value={pixTipo || ''}
                  onValueChange={(value) => setValue('pix_tipo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de chave" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_PIX.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix_chave">Chave PIX</Label>
                <Input
                  id="pix_chave"
                  placeholder={
                    pixTipo === 'CPF' ? '000.000.000-00' :
                    pixTipo === 'CNPJ' ? '00.000.000/0000-00' :
                    pixTipo === 'E-mail' ? 'email@exemplo.com' :
                    pixTipo === 'Telefone' ? '(00) 00000-0000' :
                    'Chave aleatória'
                  }
                  {...register('pix_chave')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Observações ADM */}
        <Card>
          <CardHeader>
            <CardTitle>Observações Administrativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="observacao">Observações Internas</Label>
              <Textarea
                id="observacao"
                placeholder="Observações administrativas internas (não visível para o cliente)..."
                rows={4}
                {...register('observacao')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="min-w-[120px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar (Ctrl+S)'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}