import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ContatoCompleto } from '@/types/contatos';
import { meioContatoSchema } from '@/lib/validators';
import { useCtrlS } from '@/hooks/useCtrlS';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Trash2, Edit, Search, ArrowUpDown, Phone, Mail, MessageCircle, Globe, Video } from 'lucide-react';
import { z } from 'zod';

type MeioContatoFormData = z.infer<typeof meioContatoSchema>;

interface MeioContato {
  id: string;
  tipo: string;
  valor: string;
  principal: boolean;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

interface MeiosContatoTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function MeiosContatoTab({ contato }: MeiosContatoTabProps) {
  const [meiosContato, setMeiosContato] = useState<MeioContato[]>([]);
  const [editingMeio, setEditingMeio] = useState<MeioContato | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof MeioContato>('tipo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty }
  } = useForm<MeioContatoFormData>({
    resolver: zodResolver(meioContatoSchema),
    defaultValues: {
      principal: false,
    }
  });

  const tipoOptions = [
    { value: 'telefone', label: 'Telefone', icon: Phone },
    { value: 'celular', label: 'Celular', icon: Phone },
    { value: 'email', label: 'E-mail', icon: Mail },
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { value: 'telegram', label: 'Telegram', icon: MessageCircle },
    { value: 'meet', label: 'Meet', icon: Video },
    { value: 'skype', label: 'Skype', icon: MessageCircle },
    { value: 'website', label: 'Website', icon: Globe },
    { value: 'linkedin', label: 'LinkedIn', icon: Globe },
    { value: 'facebook', label: 'Facebook', icon: Globe },
    { value: 'instagram', label: 'Instagram', icon: Globe },
    { value: 'outro', label: 'Outro', icon: MessageCircle },
  ];

  // Load meios de contato
  useEffect(() => {
    loadMeiosContato();
  }, [contato.id]);

  const loadMeiosContato = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contato_meios_contato')
        .select('*')
        .eq('contato_id', contato.id)
        .order('principal', { ascending: false })
        .order('tipo');

      if (error) throw error;
      setMeiosContato(data || []);
    } catch (error) {
      console.error('Erro ao carregar meios de contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar meios de contato",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MeioContatoFormData) => {
    setSaving(true);
    try {
      // Validate required fields
      if (!data.tipo || data.tipo.trim() === '') {
        toast({
          title: "Erro",
          description: "Selecione o tipo de meio de contato",
          variant: "destructive",
        });
        return;
      }

      if (!data.valor || data.valor.trim() === '') {
        toast({
          title: "Erro",
          description: "Digite o valor do meio de contato",
          variant: "destructive",
        });
        return;
      }

      // Usar empresa_id do perfil do usuário logado como tenant_id para RLS
      const tenantId = profile?.empresa_id;
      if (!tenantId) {
        throw new Error('Empresa não configurada no perfil do usuário');
      }

      const meioData = {
        contato_id: contato.id,
        tenant_id: tenantId, // Usar empresa_id do usuário logado
        empresa_id: contato.empresa_id || null,
        filial_id: contato.filial_id || null,
        tipo: data.tipo,
        valor: data.valor,
        principal: data.principal || false,
        observacao: data.observacao || null,
      };

      if (editingMeio) {
        const { error } = await supabase
          .from('contato_meios_contato')
          .update(meioData)
          .eq('id', editingMeio.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Meio de contato atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('contato_meios_contato')
          .insert(meioData);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Meio de contato criado com sucesso",
        });
      }

      await loadMeiosContato();
      setIsDialogOpen(false);
      setEditingMeio(null);
      reset();
    } catch (error) {
      console.error('Erro ao salvar meio de contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar meio de contato",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (meio: MeioContato) => {
    setEditingMeio(meio);
    reset({
      tipo: meio.tipo,
      valor: meio.valor,
      principal: meio.principal,
      observacao: meio.observacao || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este meio de contato?')) return;

    try {
      const { error } = await supabase
        .from('contato_meios_contato')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Meio de contato excluído com sucesso",
      });
      
      await loadMeiosContato();
    } catch (error) {
      console.error('Erro ao excluir meio de contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir meio de contato",
        variant: "destructive",
      });
    }
  };

  const openNewDialog = () => {
    setEditingMeio(null);
    reset({
      principal: false,
    });
    setIsDialogOpen(true);
  };

  const handleSort = (field: keyof MeioContato) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedMeios = meiosContato
    .filter(meio => 
      meio.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meio.valor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meio.observacao && meio.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return (aValue === bValue ? 0 : aValue ? 1 : -1) * direction;
      }
      return 0;
    });

  const getIconForTipo = (tipo: string) => {
    const option = tipoOptions.find(opt => opt.value === tipo);
    const IconComponent = option?.icon || MessageCircle;
    return <IconComponent className="w-4 h-4" />;
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
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Meios de Contato
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Meio de Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingMeio ? 'Editar Meio de Contato' : 'Novo Meio de Contato'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Tipo */}
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select 
                    value={watch('tipo')} 
                    onValueChange={(value) => setValue('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tipo && (
                    <p className="text-sm text-destructive">{errors.tipo.message}</p>
                  )}
                </div>

                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    {...register('valor')}
                    placeholder="Digite o valor do contato..."
                  />
                  {errors.valor && (
                    <p className="text-sm text-destructive">{errors.valor.message}</p>
                  )}
                </div>

                {/* Principal */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="principal"
                    checked={watch('principal')}
                    onCheckedChange={(checked) => setValue('principal', checked)}
                  />
                  <Label htmlFor="principal">
                    Meio de contato principal
                  </Label>
                </div>

                {/* Observação */}
                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    {...register('observacao')}
                    placeholder="Observações sobre este meio de contato..."
                    rows={3}
                  />
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
        {/* Busca */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tipo, valor ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredAndSortedMeios.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Nenhum meio de contato encontrado' : 'Nenhum meio de contato cadastrado'}
            </p>
            <Button onClick={openNewDialog} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Meio de Contato
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('tipo')}>
                    <div className="flex items-center gap-2">
                      Tipo
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('valor')}>
                    <div className="flex items-center gap-2">
                      Valor
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('principal')}>
                    <div className="flex items-center gap-2">
                      Principal
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedMeios.map((meio) => (
                  <TableRow key={meio.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconForTipo(meio.tipo)}
                        <span className="capitalize">
                          {tipoOptions.find(opt => opt.value === meio.tipo)?.label || meio.tipo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {meio.valor}
                    </TableCell>
                    <TableCell>
                      {meio.principal && (
                        <Badge variant="default" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {meio.observacao}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(meio)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(meio.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}