import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useDebugLogger } from '@/hooks/useDebugSystem';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Search } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ContatosGrid } from '../ContatosGrid';
import { useNavigate } from 'react-router-dom';

const vinculoSchema = z.object({
  vinculadoId: z.string().min(1, 'Selecione um contato'),
  tipoVinculo: z.string().min(1, 'Selecione o tipo de vínculo'),
  bidirecional: z.boolean().default(true),
  observacao: z.string().optional(),
});

type FormData = z.infer<typeof vinculoSchema>;

interface VinculosTabProps {
  contato: any;
  onUpdate: (contato: any) => void;
  isEditing?: boolean;
}

export function VinculosTab({ contato }: VinculosTabProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debug = useDebugLogger('VinculosTab');
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(vinculoSchema),
    defaultValues: {
      bidirecional: true,
    },
  });

  // Buscar vínculos existentes com dados do contato vinculado
  const { data: vinculos = [], refetch: refetchVinculos } = useQuery({
    queryKey: ['contato-vinculos', contato.id],
    queryFn: async () => {
      debug.logInfo('Buscando vínculos', { contatoId: contato.id });

      const { data, error } = await supabase
        .from('contato_vinculos')
        .select(`
          *,
          contato_vinculado:contatos_v2!contato_vinculos_vinculado_id_fkey(
            id,
            nome_fantasia,
            contato_enderecos!contato_enderecos_contato_id_fkey(
              logradouro,
              numero,
              complemento,
              bairro,
              cidade,
              uf,
              cep,
              principal
            ),
            contato_meios_contato!contato_meios_contato_contato_id_fkey(
              tipo,
              valor,
              principal
            )
          )
        `)
        .eq('contato_id', contato.id);

      if (error) {
        debug.logError('Erro ao buscar vínculos', error, { contatoId: contato.id });
        throw error;
      }

      debug.logSuccess('Vínculos encontrados', { 
        contatoId: contato.id, 
        quantidade: data?.length || 0,
        vinculos: data 
      });
      return data || [];
    },
  });

  // Buscar contatos para vincular
  const { data: contatosDisponiveis = [], refetch: refetchContatos } = useQuery({
    queryKey: ['contatos-busca', searchTerm],
    queryFn: async () => {
      debug.logInfo('Buscando contatos para vincular', { searchTerm });

      if (!searchTerm || searchTerm.length < 2) {
        debug.logInfo('Termo de busca muito curto', { searchTerm });
        return [];
      }

      const { data, error } = await supabase
        .from('contatos_v2')
        .select('id, nome_fantasia')
        .neq('id', contato.id)
        .ilike('nome_fantasia', `%${searchTerm}%`)
        .limit(10);

      if (error) {
        debug.logError('Erro ao buscar contatos', error, { searchTerm });
        throw error;
      }

      debug.logSuccess('Contatos encontrados para vincular', { 
        searchTerm, 
        quantidade: data?.length || 0,
        contatos: data 
      });
      return data || [];
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
  });

  const onSubmit = async (values: FormData) => {
    debug.logInfo('Iniciando onSubmit', { values, contato: contato.id });
    
    if (!user || !profile) {
      debug.logError('Usuário ou perfil não encontrado', null, { 
        user: !!user, 
        profile: !!profile 
      });
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    if (!values.vinculadoId) {
      debug.logError('ID do vinculado não fornecido', null, { values });
      toast({
        title: "Erro",
        description: "Contato para vincular não selecionado",
        variant: "destructive",
      });
      return;
    }

    try {
      if (values.bidirecional) {
        // Criar dois registros (A->B e B->A) sem depender de RPC
        debug.logInfo('Criando vínculo bidirecional', {
          contatoId: contato.id,
          vinculadoId: values.vinculadoId,
          tipoVinculo: values.tipoVinculo
        });

        const rows = [
          {
            user_id: user?.id || '00000000-0000-0000-0000-000000000000',
            tenant_id: contato.tenant_id, // Mantido - lê do contato existente
            contato_id: contato.id,
            empresa_id: contato.empresa_id || null,
            filial_id: contato.filial_id || null,
            vinculado_id: values.vinculadoId,
            tipo_vinculo: values.tipoVinculo,
            bidirecional: true,
            observacao: values.observacao || null,
          },
          {
            user_id: user?.id || '00000000-0000-0000-0000-000000000000',
            tenant_id: contato.tenant_id, // Mantido - lê do contato existente
            contato_id: values.vinculadoId,
            empresa_id: contato.empresa_id || null,
            filial_id: contato.filial_id || null,
            vinculado_id: contato.id,
            tipo_vinculo: values.tipoVinculo,
            bidirecional: true,
            observacao: values.observacao || null,
          },
        ];

        const { data, error } = await supabase
          .from('contato_vinculos')
          .insert(rows)
          .select();

        if (error) {
          debug.logError('Erro ao inserir vínculo bidirecional', error, { rows });
          throw error;
        }

        debug.logSuccess('Vínculo bidirecional criado com sucesso', { insertedData: data });
      } else {
        // Para vínculos unidirecionais, manter a lógica existente
        debug.logInfo('Criando vínculo unidirecional', {
          contatoId: contato.id,
          vinculadoId: values.vinculadoId,
          tipoVinculo: values.tipoVinculo
        });

        const vinculoData = {
          user_id: user?.id || '00000000-0000-0000-0000-000000000000',
          tenant_id: contato.tenant_id, // Mantido - lê do contato existente
          contato_id: contato.id,
          empresa_id: contato.empresa_id || null,
          filial_id: contato.filial_id || null,
          vinculado_id: values.vinculadoId,
          tipo_vinculo: values.tipoVinculo,
          bidirecional: false,
          observacao: values.observacao || null
        };

        const { data, error } = await supabase
          .from('contato_vinculos')
          .insert(vinculoData)
          .select();

        if (error) {
          debug.logError('Erro ao inserir vínculo unidirecional', error, { vinculoData });
          throw error;
        }

        debug.logSuccess('Vínculo unidirecional criado com sucesso', { insertedData: data });
      }
      
      toast({
        title: "Sucesso",
        description: values.bidirecional 
          ? "Vínculo bidirecional criado com sucesso!" 
          : "Vínculo criado com sucesso!",
      });

      form.reset();
      setSearchTerm('');
      setIsDialogOpen(false);
      refetchVinculos();
      
    } catch (error: any) {
      debug.logError('Erro geral ao salvar vínculo', error, { values, contato });
      toast({
        title: "Erro",
        description: `Erro ao salvar vínculo: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveVinculo = async (vinculoId: string) => {
    debug.logInfo('Removendo vínculo', { vinculoId });
    
    try {
      const { error } = await supabase
        .from('contato_vinculos')
        .delete()
        .eq('id', vinculoId);

      if (error) {
        debug.logError('Erro ao remover vínculo', error, { vinculoId });
        throw error;
      }

      debug.logSuccess('Vínculo removido com sucesso', { vinculoId });
      
      toast({
        title: "Sucesso",
        description: "Vínculo removido com sucesso!",
      });

      refetchVinculos();
    } catch (error: any) {
      debug.logError('Erro geral ao remover vínculo', error, { vinculoId });
      toast({
        title: "Erro",
        description: `Erro ao remover vínculo: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Transformar vínculos em formato de contatos para usar a ContatosGrid
  const vinculosAsContacts = useMemo(() => {
    return vinculos.map(vinculo => {
      const contatoVinculado = vinculo.contato_vinculado;
      if (!contatoVinculado) return null;

      // Montar endereço principal do contato vinculado
      const endereco = contatoVinculado.contato_enderecos?.find(e => e.principal) || contatoVinculado.contato_enderecos?.[0];
      const enderecoCompleto = endereco ? [
        endereco.logradouro,
        endereco.numero,
        endereco.bairro,
        endereco.cidade,
        endereco.uf
      ].filter(Boolean).join(', ') : '';

      // Extrair telefone e email dos meios de contato
      const meiosContato = contatoVinculado.contato_meios_contato || [];
      const emailPrincipal = meiosContato.find(m => m.tipo === 'email' && m.principal)?.valor || 
                             meiosContato.find(m => m.tipo === 'email')?.valor || '';
      const celularPrincipal = meiosContato.find(m => m.tipo === 'celular' && m.principal)?.valor || 
                               meiosContato.find(m => m.tipo === 'celular')?.valor || '';

      return {
        ...contatoVinculado,
        endereco: enderecoCompleto,
        email: emailPrincipal,
        celular: celularPrincipal,
        // Adicionar informações do vínculo para referência
        _vinculo_id: vinculo.id,
        _vinculo_tipo: vinculo.tipo_vinculo,
        _vinculo_bidirecional: vinculo.bidirecional,
        _vinculo_observacao: vinculo.observacao
      };
    }).filter(Boolean);
  }, [vinculos]);

  const tiposVinculo = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'filho', label: 'Filho(a)' },
    { value: 'conjuge', label: 'Cônjuge' },
    { value: 'companheiro', label: 'Companheiro(a)' },
    { value: 'socio', label: 'Sócio' },
    { value: 'representante', label: 'Representante Legal' },
    { value: 'procurador', label: 'Procurador' },
    { value: 'outro', label: 'Outro' },
  ];

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vínculos</h2>
          <p className="text-muted-foreground mt-1">
            {vinculos.length} vínculo{vinculos.length !== 1 ? 's' : ''} cadastrado{vinculos.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Vínculo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Vínculo</DialogTitle>
              <DialogDescription>Preencha os dados para criar o vínculo entre contatos.</DialogDescription>
            </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Busca de Contato */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar Contato</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Digite para buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {contatosDisponiveis.length > 0 && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {contatosDisponiveis.map((contato) => (
                          <button
                            key={contato.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                            onClick={() => {
                              form.setValue('vinculadoId', contato.id);
                              setSearchTerm(contato.nome_fantasia);
                            }}
                          >
                            {contato.nome_fantasia}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tipo de Vínculo */}
                  <FormField
                    control={form.control}
                    name="tipoVinculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Vínculo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposVinculo.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bidirecional */}
                  <FormField
                    control={form.control}
                    name="bidirecional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Vínculo Bidirecional</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            O vínculo será criado em ambas as direções
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Observação */}
                  <FormField
                    control={form.control}
                    name="observacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observação</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações sobre o vínculo..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Salvar
                    </Button>
                  </div>
                </form>
              </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Vínculos usando o mesmo componente da página Contatos */}
      <ContatosGrid 
        contacts={vinculosAsContacts}
        onContactEdit={(contactId) => {
          navigate(`/contatos/${contactId}/editar`);
        }}
        onContactDelete={(contactId) => {
          const vinculo = vinculos.find(v => v.contato_vinculado?.id === contactId);
          if (vinculo) {
            handleRemoveVinculo(vinculo.id);
          }
        }}
        customBadges={(contact: any) => (
          <div className="flex gap-1 flex-wrap">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {tiposVinculo.find(t => t.value === contact._vinculo_tipo)?.label || contact._vinculo_tipo}
            </span>
            {contact._vinculo_bidirecional && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                ↔️ Bidirecional
              </span>
            )}
            {contact._vinculo_observacao && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground" title={contact._vinculo_observacao}>
                💬 Obs.
              </span>
            )}
          </div>
        )}
      />
    </div>
  );
}