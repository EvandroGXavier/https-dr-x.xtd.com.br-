import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ContatoCompleto, TipoContato } from '@/types/contatos';
import { useCpfCnpj } from '@/hooks/useCpfCnpj';
import { useCnpjLookup } from '@/hooks/useCnpjLookup';
import { useCtrlS } from '@/hooks/useCtrlS';
import { formatPhone } from '@/lib/formatters';

// Schema de validação
const contatoSchema = z.object({
  nome_fantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  celular: z.string().min(1, 'Celular é obrigatório'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  cpf_cnpj: z.string().optional(),
  observacao: z.string().optional(),
});

type ContatoFormData = z.infer<typeof contatoSchema>;

interface ContatoTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function ContatoTab({ contato, onUpdate, isEditing = true }: ContatoTabProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const { lookup: lookupCnpj, loading: isLoadingCnpj, data: cnpjData, error: cnpjError } = useCnpjLookup();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty }
  } = useForm<ContatoFormData>({
    resolver: zodResolver(contatoSchema),
    defaultValues: {
      nome_fantasia: contato.nome_fantasia || '',
      cpf_cnpj: contato.cpf_cnpj || '',
      email: contato.email || '',
      celular: contato.celular || '',
      telefone: contato.telefone || '',
      observacao: contato.observacao || '',
    }
  });

  const cpfCnpjValue = watch('cpf_cnpj') || '';
  const cpfCnpj = useCpfCnpj(cpfCnpjValue);
  const { kind: tipoDocumento, isValid: documentoValido } = cpfCnpj;

  // Determinar tipo de pessoa baseado no documento
  const getTipoPessoa = (): TipoContato => {
    if (tipoDocumento === 'cpf') return 'pf';
    if (tipoDocumento === 'cnpj') return 'pj';
    return 'lead';
  };

  // Função para consultar CNPJ
  const handleConsultarCNPJ = async () => {
    const cnpjLimpo = cpfCnpjValue.replace(/\D/g, '');
    
    // Só consulta se for CNPJ válido (14 dígitos)
    if (cnpjLimpo.length !== 14) {
      return;
    }
    
    await lookupCnpj(cnpjLimpo);
  };

  // Preencher campos automaticamente quando dados do CNPJ chegarem
  useEffect(() => {
    if (cnpjData) {
      // Preencher nome fantasia e telefone
      if (cnpjData.nome_fantasia) {
        setValue('nome_fantasia', cnpjData.nome_fantasia);
      }
      if (cnpjData.telefone) {
        setValue('telefone', cnpjData.telefone);
      }
      if (cnpjData.email) {
        setValue('email', cnpjData.email);
      }
      
      // Toast sugerindo aplicar endereço
      if (cnpjData.endereco) {
        toast({
          title: "Dados do CNPJ carregados",
          description: "Deseja aplicar o endereço encontrado?",
          action: (
            <Button size="sm" onClick={handleApplyCnpjAddress}>
              Aplicar Endereço
            </Button>
          ),
        });
      } else {
        toast({
          title: "Dados do CNPJ carregados",
          description: "Informações preenchidas com sucesso!",
        });
      }
    }
  }, [cnpjData]);

  // Verificar se os campos obrigatórios estão preenchidos por tipo
  const isFormValid = () => {
    const tipo = getTipoPessoa();
    const nomeFantasia = watch('nome_fantasia');
    
    // Nome fantasia sempre obrigatório
    if (!nomeFantasia || nomeFantasia.trim() === '') return false;
    
    // Para PF, CPF é obrigatório e deve ser válido
    if (tipo === 'pf') {
      return cpfCnpj.kind === 'cpf' && cpfCnpj.isValid;
    }
    
    // Para PJ, CNPJ é obrigatório e deve ser válido
    if (tipo === 'pj') {
      return cpfCnpj.kind === 'cnpj' && cpfCnpj.isValid;
    }
    
    // Para lead, não exige documento
    return true;
  };

  const onSubmit = async (data: ContatoFormData) => {
    setIsSaving(true);
    try {
      // 1. Atualizar dados básicos do contato (sem celular, telefone, email)
      const cpfCnpjClean = (data.cpf_cnpj || '').replace(/\D/g, '');
      const contatoPayload = {
        nome_fantasia: data.nome_fantasia.trim(),
        cpf_cnpj: cpfCnpjClean.length ? cpfCnpjClean : null,
        observacao: data.observacao?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRow, error: contatoError } = await supabase
        .from('contatos_v2')
        .update(contatoPayload)
        .eq('id', contato.id)
        .select('id, observacao, nome_fantasia, cpf_cnpj')
        .maybeSingle();

      if (contatoError || !updatedRow) {
        console.error('Erro ao salvar contato:', contatoError);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as alterações do contato.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Contato salvo:', updatedRow);

      // 2. Atualizar meios de contato
      const meiosContato = [
        { tipo: 'Celular', valor: data.celular.trim(), principal: true },
        ...(data.telefone ? [{ tipo: 'Telefone', valor: data.telefone.trim(), principal: false }] : []),
        ...(data.email ? [{ tipo: 'Email', valor: data.email.trim(), principal: true }] : []),
      ].filter(m => m.valor);

      // Deletar meios de contato existentes
      await supabase
        .from('contato_meios_contato')
        .delete()
        .eq('contato_id', contato.id);

      // Inserir novos meios de contato
      if (meiosContato.length > 0) {
        const { error: meiosError } = await supabase
          .from('contato_meios_contato')
          .insert(meiosContato.map(m => ({
            contato_id: contato.id,
            tipo: m.tipo,
            valor: m.valor,
            principal: m.principal,
            tenant_id: profile?.empresa_id || contato.empresa_id || contato.tenant_id,
            empresa_id: contato.empresa_id,
            filial_id: contato.filial_id,
          })));

        if (meiosError) {
          console.error('Erro ao salvar meios de contato:', meiosError);
          toast({
            title: "Erro ao salvar",
            description: "Não foi possível salvar os meios de contato.",
            variant: "destructive",
          });
          return;
        }
      }

      // Atualizar contato local com dados do servidor
      const updatedContato = {
        ...contato,
        nome_fantasia: updatedRow.nome_fantasia,
        cpf_cnpj: updatedRow.cpf_cnpj,
        observacao: updatedRow.observacao,
        celular: data.celular,
        telefone: data.telefone || null,
        email: data.email || null,
      };

      onUpdate(updatedContato);

      toast({
        title: "Sucesso",
        description: "Contato salvo com sucesso!",
        variant: "default",
      });

    } catch (error) {
      console.error('Erro inesperado ao salvar contato:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao salvar o contato.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Atalho Ctrl+S para salvar
  useCtrlS(() => {
    if (isDirty && isFormValid()) {
      handleSubmit(onSubmit)();
    }
  });

  // Helper function to suggest address application
  const handleApplyCnpjAddress = async () => {
    if (!cnpjData?.endereco) return;
    
    // Helper function to sanitize coordinates
    const sanitizeCoordinate = (value: any, type: string): number | null => {
      if (value === null || value === undefined || value === '') return null;
      
      const num = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(num)) return null;
      
      // Validate coordinate ranges
      if (type === 'latitude' && (num < -90 || num > 90)) return null;
      if (type === 'longitude' && (num < -180 || num > 180)) return null;
      
      return num;
    };

    const enderecoData = {
      contato_id: contato.id,
      tenant_id: contato.tenant_id, // Mantido - lê do contato existente
      empresa_id: contato.empresa_id || null,
      filial_id: contato.filial_id || null,
      tipo: 'Receita',
      logradouro: cnpjData.endereco || '',
      numero: cnpjData.numero || '',
      complemento: cnpjData.complemento || '',
      bairro: cnpjData.bairro || '',
      cidade: cnpjData.cidade || '',
      uf: cnpjData.uf || cnpjData.estado || '',
      cep: cnpjData.cep ? cnpjData.cep.replace(/\D/g, '') : '',
      principal: true,
      ibge: cnpjData.municipio_ibge || null,
      latitude: sanitizeCoordinate((cnpjData as any).latitude, 'latitude'),
      longitude: sanitizeCoordinate((cnpjData as any).longitude, 'longitude'),
    };

    try {
      // Check if primary address exists
      const { data: existingPrincipal } = await supabase
        .from('contato_enderecos')
        .select('id')
        .eq('contato_id', contato.id)
        .eq('principal', true)
        .maybeSingle();

      const { error } = existingPrincipal 
        ? await supabase
            .from('contato_enderecos')
            .update(enderecoData)
            .eq('id', existingPrincipal.id)
        : await supabase
            .from('contato_enderecos')
            .insert([enderecoData]);

      if (error) throw error;

      toast({
        title: "Endereço aplicado",
        description: "Endereço do CNPJ aplicado com sucesso!",
        variant: "default",
      });
    } catch (error) {
      console.error('Erro ao aplicar endereço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o endereço do CNPJ.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Contato</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Primeira linha: Nome, Celular, Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia *</Label>
              <Input
                id="nome_fantasia"
                {...register('nome_fantasia')}
                placeholder="Nome fantasia (obrigatório)"
                aria-invalid={errors.nome_fantasia ? 'true' : 'false'}
                aria-describedby={errors.nome_fantasia ? 'nome_fantasia-error' : undefined}
                aria-required="true"
              />
              {errors.nome_fantasia && (
                <p id="nome_fantasia-error" className="text-sm text-destructive">
                  {errors.nome_fantasia.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular *</Label>
              <Input
                id="celular"
                {...register('celular')}
                placeholder="(11) 99999-9999"
                aria-invalid={errors.celular ? 'true' : 'false'}
                aria-describedby={errors.celular ? 'celular-error' : undefined}
                aria-required="true"
                inputMode="tel"
                onBlur={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setValue('celular', formatted);
                }}
              />
              {errors.celular && (
                <p id="celular-error" className="text-sm text-destructive">
                  {errors.celular.message}
                </p>
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
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                {cpfCnpj.kind !== 'empty' && (
                  <Badge variant={cpfCnpj.isValid ? "default" : "destructive"}>
                    {cpfCnpj.kind.toUpperCase()} {cpfCnpj.isValid ? "válido" : "inválido"}
                  </Badge>
                )}
                {isLoadingCnpj && (
                  <Badge variant="secondary">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Consultando...
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="cpf_cnpj"
                  {...register('cpf_cnpj')}
                  value={cpfCnpj.masked}
                  onChange={(e) => setValue('cpf_cnpj', e.target.value)}
                  onBlur={handleConsultarCNPJ}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  aria-invalid={cpfCnpj.kind !== 'empty' && !cpfCnpj.isValid ? 'true' : 'false'}
                  className="flex-1"
                />
                {cpfCnpj.kind === 'cnpj' && cpfCnpj.isValid && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleConsultarCNPJ}
                    disabled={isLoadingCnpj}
                    title="Consultar dados do CNPJ"
                  >
                    {isLoadingCnpj ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {cnpjError && (
                <p className="text-sm text-destructive">
                  Erro ao consultar CNPJ: {cnpjError}
                </p>
              )}
            </div>
          </div>

          {/* Terceira linha: Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observações</Label>
            <Textarea
              id="observacao"
              {...register('observacao')}
              placeholder="Observações sobre o contato"
              rows={5}
              className="w-full"
              aria-label="Observação sobre o contato"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isSaving || !isDirty || !isFormValid()}
              className="min-w-[120px]"
              aria-disabled={isSaving || !isDirty || !isFormValid()}
            >
              {isSaving ? (
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