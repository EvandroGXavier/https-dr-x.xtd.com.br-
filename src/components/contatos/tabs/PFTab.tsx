import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ContatoCompleto, ContatoPF, SEXOS, ESTADOS_CIVIS, TIPOS_EMPREGO } from '@/types/contatos';
import { pfSchema } from '@/lib/validators';
import { formatCPF, formatCurrency } from '@/lib/formatters';
import { useMemo } from 'react';
import { useCtrlS } from '@/hooks/useCtrlS';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';

type PFFormData = z.infer<typeof pfSchema>;

interface PFTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function PFTab({ contato, onUpdate }: PFTabProps) {
  const [pessoaFisica, setPessoaFisica] = useState<ContatoPF | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty }
  } = useForm<PFFormData>({
    resolver: zodResolver(pfSchema),
    defaultValues: {
      nome_completo: '',
      cpf: contato.cpf_cnpj || '',
      estado_civil: 'Solteiro',
      sexo: 'M',
      emprego: 'CTPS',
    }
  });

  const estadoCivil = watch('estado_civil');
  
  
  // Calcular percentual de preenchimento
  const percentualPreenchimento = useMemo(() => {
    const allFields = [
      'nome_completo', 'cpf', 'rg', 'orgao_expedidor', 'estado_civil', 
      'sexo', 'data_nascimento', 'nacionalidade', 'naturalidade', 
      'profissao', 'renda', 'emprego', 'ctps', 'cnis', 'pis'
    ];
    
    const formValues = watch();
    const preenchidos = allFields.filter(field => {
      const value = formValues[field as keyof typeof formValues];
      return value !== undefined && value !== null && value !== '';
    }).length;
    
    return Math.round((preenchidos / allFields.length) * 100);
  }, [watch]);

  // Load pessoa física data
  useEffect(() => {
    loadPessoaFisica();
  }, [contato.id]);

  // Sync CPF with main contact
  useEffect(() => {
    if (contato.cpf_cnpj && contato.cpf_cnpj.replace(/\D/g, '').length === 11) {
      setValue('cpf', contato.cpf_cnpj);
    }
  }, [contato.cpf_cnpj, setValue]);

  const loadPessoaFisica = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contato_pf')
        .select('*')
        .eq('contato_id', contato.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPessoaFisica(data as ContatoPF);
        setValue('nome_completo', data.nome_completo || '');
        setValue('cpf', data.cpf || '');
        setValue('rg', data.rg || '');
        setValue('orgao_expedidor', data.orgao_expedidor || '');
        setValue('estado_civil', (data.estado_civil as any) || 'Solteiro');
        setValue('sexo', (data.sexo as any) || 'M');
        setValue('data_nascimento', data.data_nascimento || '');
        setValue('nacionalidade', data.nacionalidade || '');
        setValue('naturalidade', data.naturalidade || '');
        setValue('profissao', data.profissao || '');
        setValue('renda', data.renda || undefined);
        setValue('emprego', (data.emprego as any) || 'CTPS');
        setValue('ctps', data.ctps || '');
        setValue('cnis', data.cnis || '');
        setValue('pis', data.pis || '');
        setValue('pf_obs', data.pf_obs || '');
      }
    } catch (error) {
      console.error('Erro ao carregar dados PF:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da pessoa física",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper para converter valores para inteiros de forma segura
  const toSafeInteger = (value: any, fallback: number): number => {
    if (value === null || value === undefined) return fallback;
    
    // Se for string e contém só números, converter
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const parsed = parseInt(value, 10);
      return Number.isInteger(parsed) ? parsed : fallback;
    }
    
    // Se já for número, verificar se é inteiro válido
    if (typeof value === 'number' && Number.isInteger(value)) {
      return value;
    }
    
    return fallback;
  };

  const onSubmit = async (data: PFFormData) => {
    setSaving(true);
    try {
      // Limpar campos de data: converter strings vazias para null
      const cleanData = {
        ...data,
        data_nascimento: data.data_nascimento && data.data_nascimento.trim() !== '' ? data.data_nascimento : null,
      };

      const pfData = {
        contato_id: contato.id,
        // CORREÇÃO: usar empresa_id como tenant_id, não user_id
        tenant_id: profile?.empresa_id || contato.empresa_id,
        empresa_id: contato.empresa_id,
        filial_id: contato.filial_id,
        ...cleanData,
      };

      if (pessoaFisica) {
        const { error } = await supabase
          .from('contato_pf')
          .update(pfData)
          .eq('id', pessoaFisica.id);

        if (error) throw error;
      } else {
        const { data: newPF, error } = await supabase
          .from('contato_pf')
          .insert(pfData)
          .select()
          .single();

        if (error) throw error;
        setPessoaFisica(newPF as any);
      }

      // Update main contact with nome_completo if needed
      if (data.nome_completo && !contato.nome_fantasia) {
        const { error: updateError } = await supabase
          .from('contatos_v2')
          .update({ nome_fantasia: data.nome_completo })
          .eq('id', contato.id);

        if (updateError) console.warn('Failed to update nome_fantasia:', updateError);
        
        // Update local state
        onUpdate({
          ...contato,
          nome_fantasia: data.nome_completo,
          pessoa_fisica: { ...pfData, id: pessoaFisica?.id || '', created_at: '', updated_at: '' }
        });
      }

      toast({
        title: "Sucesso",
        description: "Dados da pessoa física salvos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar dados PF:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da pessoa física",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Dados da Pessoa Física
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">Preenchimento:</span>
            <span className="text-sm font-semibold text-primary">{percentualPreenchimento}%</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Alerta para estado civil casado */}
          {(estadoCivil === 'Casado' || estadoCivil === 'União Estável') && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Como o estado civil é {estadoCivil}, considere cadastrar o vínculo do cônjuge na aba "Vínculos".
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                {...register('nome_completo')}
                placeholder="Nome completo da pessoa"
              />
              {errors.nome_completo && (
                <p className="text-sm text-destructive">{errors.nome_completo.message}</p>
              )}
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                {...register('cpf')}
                placeholder="000.000.000-00"
                maxLength={14}
                onChange={(e) => {
                  const formatted = formatCPF(e.target.value);
                  setValue('cpf', formatted);
                }}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            {/* RG */}
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                {...register('rg')}
                placeholder="00.000.000-0"
              />
            </div>

            {/* Órgão Expedidor */}
            <div className="space-y-2">
              <Label htmlFor="orgao_expedidor">Órgão Expedidor</Label>
              <Input
                id="orgao_expedidor"
                {...register('orgao_expedidor')}
                placeholder="SSP/SP"
              />
            </div>

            {/* Estado Civil */}
            <div className="space-y-2">
              <Label htmlFor="estado_civil">Estado Civil</Label>
              <Select 
                value={watch('estado_civil')} 
                onValueChange={(value) => setValue('estado_civil', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_CIVIS.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sexo */}
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select 
                value={watch('sexo')} 
                onValueChange={(value) => setValue('sexo', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {SEXOS.map((sexo) => (
                    <SelectItem key={sexo} value={sexo}>
                      {sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Outro'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register('data_nascimento')}
              />
            </div>

            {/* Nacionalidade */}
            <div className="space-y-2">
              <Label htmlFor="nacionalidade">Nacionalidade</Label>
              <Input
                id="nacionalidade"
                {...register('nacionalidade')}
                placeholder="Brasileira"
              />
            </div>

            {/* Naturalidade */}
            <div className="space-y-2">
              <Label htmlFor="naturalidade">Naturalidade</Label>
              <Input
                id="naturalidade"
                {...register('naturalidade')}
                placeholder="São Paulo/SP"
              />
            </div>

            {/* Profissão */}
            <div className="space-y-2">
              <Label htmlFor="profissao">Profissão</Label>
              <Input
                id="profissao"
                {...register('profissao')}
                placeholder="Profissão exercida"
              />
            </div>

            {/* Renda */}
            <div className="space-y-2">
              <Label htmlFor="renda">Renda Mensal</Label>
              <Controller
                control={control}
                name="renda"
                render={({ field }) => {
                  const masked = typeof field.value === 'number' ? formatCurrency(field.value) : '';
                  return (
                    <Input
                      id="renda"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={masked}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const clamped = digits.slice(0, 9); // até 9 dígitos (inclui centavos)
                        if (!clamped) {
                          field.onChange(undefined);
                          return;
                        }
                        const cents = parseInt(clamped, 10);
                        const valueNumber = cents / 100;
                        field.onChange(valueNumber);
                      }}
                    />
                  );
                }}
              />
              {errors.renda && (
                <p className="text-sm text-destructive">{errors.renda.message}</p>
              )}
            </div>

            {/* Emprego */}
            <div className="space-y-2">
              <Label htmlFor="emprego">Emprego</Label>
              <Select 
                value={watch('emprego')} 
                onValueChange={(value) => setValue('emprego', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_EMPREGO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CTPS */}
            <div className="space-y-2">
              <Label htmlFor="ctps">CTPS</Label>
              <Input
                id="ctps"
                {...register('ctps')}
                placeholder="Número da carteira"
              />
            </div>

            {/* CNIS */}
            <div className="space-y-2">
              <Label htmlFor="cnis">CNIS</Label>
              <Input
                id="cnis"
                {...register('cnis')}
                placeholder="Número do CNIS"
              />
            </div>

            {/* PIS */}
            <div className="space-y-2">
              <Label htmlFor="pis">PIS</Label>
              <Input
                id="pis"
                {...register('pis')}
                placeholder="Número do PIS"
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="pf_obs">Observações</Label>
              <Textarea
                id="pf_obs"
                {...register('pf_obs')}
                placeholder="Informações atípicas importantes sobre a pessoa física (ex: dados de passaporte, certidão de óbito, etc.)"
                rows={4}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving || !isDirty}>
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
      </CardContent>
    </Card>
  );
}