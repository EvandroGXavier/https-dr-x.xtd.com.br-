import { useState, useEffect } from 'react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { Plus, Calendar, Users, CreditCard, Upload, Camera, FileText } from 'lucide-react';
import { ContatoQuickActions } from '@/components/contatos/ContatoQuickActions';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { consultarCNPJ } from '@/lib/cnpj';

interface NovaTransacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaTransacaoDialog({ open, onOpenChange }: NovaTransacaoDialogProps) {
  const [tipo, setTipo] = useState<'receber' | 'pagar'>('receber');
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [contatos, setContatos] = useState<any[]>([]);
  const [contasFinanceiras, setContasFinanceiras] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentAnalysis, setDocumentAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const isAnalyzing = false;

  const [formData, setFormData] = useState({
    contato_id: '',
    tipo: 'receber' as 'receber' | 'pagar',
    valor_documento: '',
    data_emissao: '',
    data_vencimento: '',
    numero_documento: '',
    categoria: '',
    historico: '',
    conta_financeira_id: '',
    forma_pagamento: '',
    data_competencia: '',
    recorrente: false,
    periodicidade: 'mensal',
    parcelas: '1'
  });

  // Buscar contatos e contas financeiras ao abrir o modal
  useEffect(() => {
    if (open) {
      fetchContatos();
      fetchContasFinanceiras();
    }
  }, [open]);

  const fetchContatos = async () => {
    try {
      const { data, error } = await supabase
        .from('contatos_v2')
        .select(`
          id, 
          nome_fantasia, 
          cpf_cnpj,
          contato_meios_contato(tipo, valor),
          contato_enderecos(logradouro, numero, bairro, cidade, uf, cep)
        `)
        .order('nome_fantasia');

      if (error) throw error;
      setContatos(data?.map(c => ({
        id: c.id,
        nome: c.nome_fantasia || '',
        documento: c.cpf_cnpj || '',
        meios_contato: c.contato_meios_contato || [],
        enderecos: c.contato_enderecos || []
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos",
        variant: "destructive",
      });
    }
  };

  const fetchContasFinanceiras = async () => {
    try {
      const { data, error } = await supabase
        .from('contas_financeiras')
        .select('id, nome, banco, tipo')
        .eq('ativa', true)
        .order('nome');

      if (error) throw error;
      setContasFinanceiras(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas financeiras:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas financeiras",
        variant: "destructive",
      });
    }
  };

  const categorias = [
    { value: 'servicos', label: 'Serviços' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'cobranca', label: 'Cobrança' },
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'fornecedores', label: 'Fornecedores' },
    { value: 'impostos', label: 'Impostos' },
    { value: 'outros', label: 'Outros' }
  ];


  const formasPagamento = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'deposito', label: 'Depósito' }
  ];

  const periodicidades = [
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' }
  ];

  const generateRecurringDates = (startDate: string, periodicidade: string, numParcelas: number) => {
    const dates = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < numParcelas; i++) {
      dates.push(new Date(currentDate));
      
      switch (periodicidade) {
        case 'semanal':
          currentDate = addWeeks(currentDate, 1);
          break;
        case 'quinzenal':
          currentDate = addDays(currentDate, 15);
          break;
        case 'mensal':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'bimestral':
          currentDate = addMonths(currentDate, 2);
          break;
        case 'trimestral':
          currentDate = addMonths(currentDate, 3);
          break;
        case 'semestral':
          currentDate = addMonths(currentDate, 6);
          break;
        case 'anual':
          currentDate = addMonths(currentDate, 12);
          break;
      }
    }
    
    return dates;
  };

  // Upload do arquivo para o storage
  const uploadDocumentToStorage = async (file: File, transacaoId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${transacaoId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('documentos-financeiros')
        .upload(fileName, file);
      
      if (error) throw error;
      return data.path;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.contato_id || !formData.valor_documento || !formData.data_vencimento || !formData.conta_financeira_id) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (Contato, Valor, Vencimento e Conta Financeira)",
        variant: "destructive",
      });
      return;
    }

    // Verificar se já existe transação com mesmo número de documento
    if (formData.numero_documento) {
      const { data: existingTransaction } = await supabase
        .from('transacoes_financeiras')
        .select('id')
        .eq('numero_documento', formData.numero_documento)
        .maybeSingle();
      
      if (existingTransaction) {
        toast({
          title: "Erro",
          description: "Já existe uma transação com este número de documento",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      if (formData.recorrente && parseInt(formData.parcelas) > 1) {
        // Generate recurring transactions
        const dates = generateRecurringDates(formData.data_vencimento, formData.periodicidade, parseInt(formData.parcelas));
        const valorParcela = parseFloat(formData.valor_documento) / parseInt(formData.parcelas);
        
        const transacoes = dates.map((date, index) => ({
          user_id: userData.user.id,
          contato_id: formData.contato_id,
          tipo: formData.tipo,
          valor_documento: valorParcela,
          data_emissao: formData.data_emissao || new Date().toISOString().split('T')[0],
          data_vencimento: format(date, 'yyyy-MM-dd'),
          numero_documento: `${formData.numero_documento || formData.tipo.toUpperCase()}-${Date.now()}/${index + 1}`,
          categoria: formData.categoria,
          historico: `${formData.historico} - Parcela ${index + 1}/${formData.parcelas}`,
          conta_financeira_id: formData.conta_financeira_id || null,
          forma_pagamento: formData.forma_pagamento,
          data_competencia: formData.data_competencia || null,
          situacao: 'aberta'
        }));

        const { error } = await supabase
          .from('transacoes_financeiras')
          .insert(transacoes);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: `${formData.parcelas} transações recorrentes criadas com sucesso!`,
        });
      } else {
        // Single transaction
        const transacaoData = {
          user_id: userData.user.id,
          contato_id: formData.contato_id,
          tipo: formData.tipo,
          valor_documento: parseFloat(formData.valor_documento),
          data_emissao: formData.data_emissao || new Date().toISOString().split('T')[0],
          data_vencimento: formData.data_vencimento,
          numero_documento: formData.numero_documento || `${formData.tipo.toUpperCase()}-${Date.now()}`,
          categoria: formData.categoria,
          historico: formData.historico,
          conta_financeira_id: formData.conta_financeira_id || null,
          forma_pagamento: formData.forma_pagamento,
          data_competencia: formData.data_competencia || null,
          situacao: 'aberta'
        };

        const { data: newTransaction, error } = await supabase
          .from('transacoes_financeiras')
          .insert([transacaoData])
          .select()
          .single();

        if (error) throw error;

        // Upload do arquivo se existir
        if (selectedFile && newTransaction) {
          try {
            const filePath = await uploadDocumentToStorage(selectedFile, newTransaction.id);
            
            // Atualizar transação com informações do arquivo
            await supabase
              .from('transacoes_financeiras')
              .update({
                arquivo_url: filePath,
                arquivo_nome: selectedFile.name,
                arquivo_tipo: selectedFile.type
              })
              .eq('id', newTransaction.id);

          } catch (uploadError) {
            console.error('Erro ao fazer upload do arquivo:', uploadError);
            toast({
              title: "Aviso",
              description: "Transação criada, mas houve erro no upload do arquivo",
            });
          }
        }

        toast({
          title: "Sucesso",
          description: `${tipo === 'receber' ? 'Conta a receber' : 'Conta a pagar'} criada com sucesso!`,
        });
      }

      onOpenChange(false);
      
      // Reset form
      setFormData({
        contato_id: '',
        tipo: 'receber',
        valor_documento: '',
        data_emissao: '',
        data_vencimento: '',
        numero_documento: '',
        categoria: '',
        historico: '',
        conta_financeira_id: '',
        forma_pagamento: '',
        data_competencia: '',
        recorrente: false,
        periodicidade: 'mensal',
        parcelas: '1'
      });
      setSelectedFile(null);
      setDocumentAnalysis(null);

    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a transação financeira",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    // TODO: Implementar análise quando módulo SmartUpload for reativado
    toast({
      title: "Funcionalidade descontinuada",
      description: "Análise de documentos temporariamente desabilitada",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nova Transação Financeira
          </DialogTitle>
          <DialogDescription>
            Crie uma nova conta a receber ou pagar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Transação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tipo de Transação</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tipo} onValueChange={(value) => {
                setTipo(value as 'receber' | 'pagar');
                handleInputChange('tipo', value);
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="receber" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Conta a Receber
                  </TabsTrigger>
                  <TabsTrigger value="pagar" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Conta a Pagar
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Upload de Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documento
              </CardTitle>
              <CardDescription>
                Importe um documento para preencher automaticamente os dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-primary" />
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {isAnalyzing && (
                      <p className="text-xs text-primary">Analisando documento...</p>
                    )}
                    {documentAnalysis && (
                      <p className="text-xs text-green-600">✓ Documento analisado com sucesso</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Arraste um documento aqui</p>
                      <p className="text-xs text-muted-foreground">ou clique nos botões abaixo</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={isAnalyzing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Arquivo
                  </Button>
                </div>
                
                <div>
                  <input
                    type="file"
                    id="camera-capture"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('camera-capture')?.click()}
                    disabled={isAnalyzing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Fotografar
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setDocumentAnalysis(null);
                  }}
                  className="w-full"
                >
                  Remover documento
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Principais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contato">Contato *</Label>
                  <Select value={formData.contato_id} onValueChange={(value) => handleInputChange('contato_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar contato" />
                    </SelectTrigger>
                    <SelectContent>
                      {contatos.map(contato => (
                        <SelectItem key={contato.id} value={contato.id}>
                          {contato.nome} {contato.documento && `(${contato.documento})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.contato_id && (
                    <div className="mt-2">
                      <ContatoQuickActions 
                        contato={{
                          id: formData.contato_id,
                          ...contatos.find(c => c.id === formData.contato_id)
                        }} 
                        showLinks={false}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor do Documento *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.valor_documento}
                    onChange={(e) => handleInputChange('valor_documento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_emissao">Data de Emissão</Label>
                  <Input
                    id="data_emissao"
                    type="date"
                    value={formData.data_emissao}
                    onChange={(e) => handleInputChange('data_emissao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                  <Input
                    id="data_vencimento"
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numero_documento">Número do Documento</Label>
                  <Input
                    id="numero_documento"
                    placeholder="Ex: 001, NF-123, etc."
                    value={formData.numero_documento}
                    onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(categoria => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="historico">Histórico</Label>
                <Textarea
                  id="historico"
                  placeholder="Descrição da transação..."
                  value={formData.historico}
                  onChange={(e) => handleInputChange('historico', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dados de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conta_financeira">Conta Financeira *</Label>
                  <Select value={formData.conta_financeira_id} onValueChange={(value) => handleInputChange('conta_financeira_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contasFinanceiras.map(conta => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome} {conta.banco && `- ${conta.banco}`} ({conta.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                  <Select value={formData.forma_pagamento} onValueChange={(value) => handleInputChange('forma_pagamento', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar forma" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map(forma => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_competencia">Data de Competência</Label>
                  <Input
                    id="data_competencia"
                    type="date"
                    value={formData.data_competencia}
                    onChange={(e) => handleInputChange('data_competencia', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recorrência */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recorrência
              </CardTitle>
              <CardDescription>
                Configure se esta transação se repetirá automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="recorrente" 
                  checked={isRecorrente}
                  onCheckedChange={(checked) => {
                    setIsRecorrente(checked);
                    handleInputChange('recorrente', checked);
                  }}
                />
                <Label htmlFor="recorrente">Transação recorrente</Label>
              </div>

              {isRecorrente && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodicidade">Periodicidade</Label>
                    <Select value={formData.periodicidade} onValueChange={(value) => handleInputChange('periodicidade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar periodicidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodicidades.map(periodo => (
                          <SelectItem key={periodo.value} value={periodo.value}>
                            {periodo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parcelas">Número de Parcelas</Label>
                    <Input
                      id="parcelas"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={formData.parcelas}
                      onChange={(e) => handleInputChange('parcelas', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Criando...' : `Criar ${tipo === 'receber' ? 'Conta a Receber' : 'Conta a Pagar'}`}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}