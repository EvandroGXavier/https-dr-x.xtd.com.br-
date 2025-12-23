import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ContatoCompleto, ContatoEndereco, TipoEndereco, TIPOS_ENDERECO } from '@/types/contatos';
import { enderecoSchema, sanitizeCoordinate } from '@/lib/validators';
import { formatCEP, normalizeCEP } from '@/lib/formatters';
import { useCepLookup } from '@/hooks/useCepLookup';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useCtrlS } from '@/hooks/useCtrlS';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, Loader2, Trash2, Edit, Search } from 'lucide-react';
import { z } from 'zod';

type EnderecoFormData = z.infer<typeof enderecoSchema>;

interface EnderecosTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function EnderecosTab({ contato, onUpdate }: EnderecosTabProps) {
  const [enderecos, setEnderecos] = useState<ContatoEndereco[]>([]);
  const [editingEndereco, setEditingEndereco] = useState<ContatoEndereco | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();
  const { latitude, longitude, loading: geoLoading, getNavigationUrl } = useGeolocation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<EnderecoFormData>({
    resolver: zodResolver(enderecoSchema),
    defaultValues: {
      tipo: 'Principal',
      principal: false,
    }
  });

  const cepValue = watch('cep');

  // Auto-lookup CEP
  useEffect(() => {
    if (cepValue && normalizeCEP(cepValue).length === 8) {
      const timeoutId = setTimeout(async () => {
        const dados = await lookupCep(cepValue);
        if (dados) {
          setValue('logradouro', dados.logradouro);
          setValue('bairro', dados.bairro);
          setValue('cidade', dados.localidade);
          setValue('uf', dados.uf);
          setValue('ibge', dados.ibge);
          
          toast({
            title: "CEP encontrado",
            description: `Endereço preenchido automaticamente`,
          });
        }
      }, 500); // Reduzido para 500ms para resposta mais rápida
      return () => clearTimeout(timeoutId);
    }
  }, [cepValue, lookupCep, setValue, toast]);

  // Load endereços
  useEffect(() => {
    loadEnderecos();
  }, [contato.id]);

  const loadEnderecos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contato_enderecos')
        .select('*')
        .eq('contato_id', contato.id)
        .order('principal', { ascending: false });

      if (error) throw error;
      setEnderecos((data || []) as ContatoEndereco[]);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar endereços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EnderecoFormData) => {
    console.log(`[EnderecosTab] Iniciando salvamento de endereço:`, data);
    setSaving(true);
    try {
      // Usar empresa_id do perfil do usuário logado como tenant_id para RLS
      const tenantId = profile?.empresa_id;
      if (!tenantId) {
        throw new Error('Empresa não configurada no perfil do usuário');
      }

      const enderecoData = {
        contato_id: contato.id,
        tenant_id: tenantId, // Usar empresa_id do usuário logado
        empresa_id: contato.empresa_id || null,
        filial_id: contato.filial_id || null,
        tipo: data.tipo,
        cep: data.cep ? normalizeCEP(data.cep) : '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        uf: data.uf || '',
        ibge: data.ibge || '',
        principal: data.principal || false,
        latitude: sanitizeCoordinate(data.latitude, 'latitude'),
        longitude: sanitizeCoordinate(data.longitude, 'longitude'),
      };

      console.log(`[EnderecosTab] Dados do endereço preparados:`, enderecoData);

      let enderecoId: string;

      if (editingEndereco) {
        console.log(`[EnderecosTab] Atualizando endereço existente: ${editingEndereco.id}`);
        const { error, data: result } = await supabase
          .from('contato_enderecos')
          .update(enderecoData)
          .eq('id', editingEndereco.id)
          .select();

        if (error) {
          console.error(`[EnderecosTab] Erro ao atualizar endereço:`, error);
          throw error;
        }

        enderecoId = editingEndereco.id;
        
        toast({
          title: "Sucesso",
          description: "Endereço atualizado com sucesso",
        });
      } else {
        console.log(`[EnderecosTab] Inserindo novo endereço`);
        const { error, data: result } = await supabase
          .from('contato_enderecos')
          .insert(enderecoData)
          .select()
          .single();

        if (error) {
          console.error(`[EnderecosTab] Erro ao inserir endereço:`, error);
          throw error;
        }

        enderecoId = result.id;
        
        toast({
          title: "Sucesso",
          description: "Endereço cadastrado com sucesso",
        });
      }

      // Se marcado como principal, usar função RPC para garantir atomicidade
      if (data.principal) {
        console.log(`[EnderecosTab] Definindo endereço ${enderecoId} como principal via RPC`);
        const { data: resultado, error: rpcError } = await supabase.rpc('definir_endereco_principal', {
          contato_alvo_id: contato.id,
          endereco_alvo_id: enderecoId,
        });

        if (rpcError) {
          console.error(`[EnderecosTab] Erro ao definir endereço principal via RPC:`, rpcError);
          // Não falha a operação pois o endereço foi salvo, apenas registra o erro
          toast({
            title: "Aviso",
            description: "Endereço salvo, mas houve um problema ao defini-lo como principal",
            variant: "destructive",
          });
        } else {
          console.log(`[EnderecosTab] Endereço definido como principal com sucesso:`, resultado);
        }
      }

      console.log(`[EnderecosTab] Recarregando lista de endereços`);
      await loadEnderecos();
      setIsDialogOpen(false);
      setEditingEndereco(null);
      reset();
      console.log(`[EnderecosTab] Endereço salvo com sucesso`);
    } catch (error) {
      console.error('[EnderecosTab] Erro ao salvar endereço:', error);
      toast({
        title: "Erro",
        description: `Erro ao salvar endereço: ${(error as Error)?.message || 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (endereco: ContatoEndereco) => {
    setEditingEndereco(endereco);
    reset({
      tipo: endereco.tipo,
      cep: endereco.cep ? formatCEP(endereco.cep) : '',
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      uf: endereco.uf || '',
      ibge: endereco.ibge || '',
      principal: endereco.principal,
      latitude: endereco.latitude || undefined,
      longitude: endereco.longitude || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

    try {
      const { error } = await supabase
        .from('contato_enderecos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Endereço excluído com sucesso",
      });
      
      await loadEnderecos();
    } catch (error) {
      console.error('Erro ao excluir endereço:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir endereço",
        variant: "destructive",
      });
    }
  };

  const handleGeolocation = async () => {
    if (latitude && longitude) {
      setValue('latitude', latitude);
      setValue('longitude', longitude);
      toast({
        title: "Localização obtida",
        description: "Coordenadas preenchidas automaticamente",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível obter sua localização",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingEndereco(null);
    reset({
      tipo: 'Principal',
      principal: enderecos.length === 0, // Primeiro endereço é principal por padrão
    });
    setIsDialogOpen(true);
  };

  useCtrlS(() => {
    if (isDirty && isDialogOpen) {
      handleSubmit(onSubmit)();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Endereços
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Endereço
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEndereco ? 'Editar Endereço' : 'Novo Endereço'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo *</Label>
                    <Select 
                      value={watch('tipo')} 
                      onValueChange={(value: TipoEndereco) => setValue('tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_ENDERECO.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CEP */}
                  <div className="space-y-2">
                    <Label htmlFor="cep" className="flex items-center gap-2">
                      CEP
                      {cepLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto w-auto p-1"
                        onClick={() => window.open('https://buscacepinter.correios.com.br/app/endereco/index.php', '_blank')}
                        title="Consultar CEP nos Correios"
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </Label>
                    <Input
                      id="cep"
                      {...register('cep')}
                      placeholder="00000-000"
                      maxLength={9}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value);
                        setValue('cep', formatted);
                      }}
                    />
                    {errors.cep && (
                      <p className="text-sm text-destructive">{errors.cep.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Logradouro */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="logradouro">Logradouro *</Label>
                    <Input
                      id="logradouro"
                      {...register('logradouro')}
                      placeholder="Rua, Avenida, etc."
                    />
                    {errors.logradouro && (
                      <p className="text-sm text-destructive">{errors.logradouro.message}</p>
                    )}
                  </div>

                  {/* Número */}
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      {...register('numero')}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Complemento */}
                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      {...register('complemento')}
                      placeholder="Apto, Sala, etc."
                    />
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      {...register('bairro')}
                      placeholder="Nome do bairro"
                    />
                    {errors.bairro && (
                      <p className="text-sm text-destructive">{errors.bairro.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cidade */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      {...register('cidade')}
                      placeholder="Nome da cidade"
                    />
                    {errors.cidade && (
                      <p className="text-sm text-destructive">{errors.cidade.message}</p>
                    )}
                  </div>

                  {/* UF */}
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF *</Label>
                    <Input
                      id="uf"
                      {...register('uf')}
                      placeholder="SP"
                      maxLength={2}
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.uf && (
                      <p className="text-sm text-destructive">{errors.uf.message}</p>
                    )}
                  </div>
                </div>

                {/* Coordenadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      {...register('latitude', { valueAsNumber: true })}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      {...register('longitude', { valueAsNumber: true })}
                      placeholder="-46.6333"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGeolocation}
                      disabled={geoLoading}
                      className="w-full"
                    >
                      {geoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                      {geoLoading ? 'Obtendo...' : 'Pegar Localização'}
                    </Button>
                  </div>
                </div>

                {/* Principal */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="principal"
                    checked={watch('principal')}
                    onCheckedChange={(checked) => setValue('principal', checked)}
                  />
                  <Label htmlFor="principal">Endereço principal</Label>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
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
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : enderecos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Nenhum endereço cadastrado
            </p>
            <Button onClick={openNewDialog} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Endereço
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enderecos.map((endereco) => {
                const enderecoFormatado = [
                  endereco.logradouro,
                  endereco.numero,
                  endereco.complemento && `- ${endereco.complemento}`,
                  endereco.bairro,
                  endereco.cidade,
                  endereco.uf,
                  endereco.cep ? `CEP ${formatCEP(endereco.cep)}` : null
                ].filter(Boolean).join(', ');

                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoFormatado)}`;

                return (
                  <TableRow key={endereco.id}>
                    <TableCell>
                      <Badge variant="outline">{endereco.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            {enderecoFormatado}
                          </a>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(mapsUrl, '_blank')}
                          title="Abrir no navegador"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {endereco.principal && (
                        <Badge>Principal</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(endereco)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(endereco.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}