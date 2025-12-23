import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Edit, Save, X, Upload, Camera, FileText } from 'lucide-react';
import { ContatoQuickActions } from '@/components/contatos/ContatoQuickActions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { consultarCNPJ } from '@/lib/cnpj';
import { supabase } from '@/integrations/supabase/client';

interface TransacaoFinanceira {
  id: string;
  contato: {
    id: string;
    nome: string;
    cpf_cnpj: string;
  };
  tipo: 'receber' | 'pagar';
  valor_documento: number;
  valor_recebido?: number;
  data_emissao: string;
  data_vencimento: string;
  data_liquidacao?: string;
  situacao: 'aberta' | 'recebida' | 'paga' | 'vencida' | 'cancelada';
  numero_documento: string;
  numero_banco?: string;
  categoria: string;
  historico: string;
  conta_financeira: string;
  forma_pagamento: string;
}

interface EditarTransacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoFinanceira | null;
  onTransacaoUpdated: () => void;
}

export function EditarTransacaoDialog({ 
  open, 
  onOpenChange, 
  transacao,
  onTransacaoUpdated 
}: EditarTransacaoDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contatos, setContatos] = useState<any[]>([]);
  const [contasFinanceiras, setContasFinanceiras] = useState<any[]>([]);
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
    data_liquidacao: '',
    numero_documento: '',
    numero_banco: '',
    categoria: '',
    historico: '',
    conta_financeira_id: '',
    forma_pagamento: '',
    situacao: 'aberta' as 'aberta' | 'recebida' | 'paga' | 'vencida' | 'cancelada',
    valor_recebido: ''
  });

  // Fetch contatos and contas financeiras
  useEffect(() => {
    if (open) {
      fetchContatos();
      fetchContasFinanceiras();
    }
  }, [open]);

  // Populate form when transacao changes AND contatos are loaded
  useEffect(() => {
    if (transacao && open && contatos.length > 0) {
      setFormData({
        contato_id: transacao.contato?.id || '',
        tipo: transacao.tipo,
        valor_documento: transacao.valor_documento.toString(),
        data_emissao: transacao.data_emissao,
        data_vencimento: transacao.data_vencimento,
        data_liquidacao: transacao.data_liquidacao || '',
        numero_documento: transacao.numero_documento || '',
        numero_banco: transacao.numero_banco || '',
        categoria: transacao.categoria || '',
        historico: transacao.historico || '',
        conta_financeira_id: '',
        forma_pagamento: transacao.forma_pagamento || '',
        situacao: transacao.situacao,
        valor_recebido: transacao.valor_recebido?.toString() || ''
      });
    }
  }, [transacao, open, contatos]);


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
    }
  };

  const fetchContasFinanceiras = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_contas_compat')
        .select('id, nome, banco, tipo')
        .order('nome');

      if (error) throw error;
      setContasFinanceiras(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas financeiras:', error);
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

  const situacoes = [
    { value: 'aberta', label: 'Aberta' },
    { value: 'recebida', label: 'Recebida' },
    { value: 'paga', label: 'Paga' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

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

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    // TODO: Implementar análise quando módulo SmartUpload for reativado
    toast({
      title: "Funcionalidade descontinuada",
      description: "Análise de documentos temporariamente desabilitada",
      variant: "destructive",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transacao) return;

    // Verificar se já existe transação com mesmo número de documento (exceto a atual)
    if (formData.numero_documento && formData.numero_documento !== transacao.numero_documento) {
      const { data: existingTransaction } = await supabase
        .from('transacoes_financeiras')
        .select('id')
        .eq('numero_documento', formData.numero_documento)
        .neq('id', transacao.id)
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
      // Ensure contato_id is not empty string
      if (!formData.contato_id || formData.contato_id.trim() === '') {
        toast({
          title: "Erro",
          description: "Por favor, selecione um contato",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const updateData: any = {
        contato_id: formData.contato_id,
        tipo: formData.tipo,
        valor_documento: parseFloat(formData.valor_documento),
        data_emissao: formData.data_emissao,
        data_vencimento: formData.data_vencimento,
        numero_documento: formData.numero_documento,
        categoria: formData.categoria,
        historico: formData.historico,
        forma_pagamento: formData.forma_pagamento,
        situacao: formData.situacao
      };

      // Add optional fields only if they have valid values
      if (formData.data_liquidacao && formData.data_liquidacao.trim() !== '') {
        updateData.data_liquidacao = formData.data_liquidacao;
      }
      if (formData.numero_banco && formData.numero_banco.trim() !== '') {
        updateData.numero_banco = formData.numero_banco;
      }
      if (formData.valor_recebido && formData.valor_recebido.trim() !== '') {
        updateData.valor_recebido = parseFloat(formData.valor_recebido);
      }
      if (formData.conta_financeira_id && formData.conta_financeira_id.trim() !== '') {
        updateData.conta_financeira_id = formData.conta_financeira_id;
      }

      // Fazer upload do arquivo se houver
      if (selectedFile) {
        try {
          const filePath = await uploadDocumentToStorage(selectedFile, transacao.id);
          updateData.arquivo_url = filePath;
          updateData.arquivo_nome = selectedFile.name;
          updateData.arquivo_tipo = selectedFile.type;
        } catch (uploadError) {
          console.error('Erro no upload do arquivo:', uploadError);
          toast({
            title: "Aviso",
            description: "Transação atualizada, mas houve erro no upload do arquivo",
            variant: "destructive",
          });
        }
      }

      const { error } = await supabase
        .from('transacoes_financeiras')
        .update(updateData)
        .eq('id', transacao.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      onTransacaoUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Transação - {transacao?.numero_documento}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Documento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documento
              </CardTitle>
              <CardDescription>
                Importe um documento para atualizar automaticamente os dados
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
                    id="file-upload-edit"
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
                    onClick={() => document.getElementById('file-upload-edit')?.click()}
                    disabled={isAnalyzing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Arquivo
                  </Button>
                </div>
                
                <div>
                  <input
                    type="file"
                    id="camera-capture-edit"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('camera-capture-edit')?.click()}
                    disabled={isAnalyzing}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Fotografar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contato">Contato</Label>
              <Select value={formData.contato_id} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, contato_id: value }))
              }>
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
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value: 'receber' | 'pagar') => 
                setFormData(prev => ({ ...prev, tipo: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receber">Conta a Receber</SelectItem>
                  <SelectItem value="pagar">Conta a Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_documento">Valor do Documento</Label>
              <Input
                id="valor_documento"
                type="number"
                step="0.01"
                value={formData.valor_documento}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_documento: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_recebido">Valor Recebido/Pago</Label>
              <Input
                id="valor_recebido"
                type="number"
                step="0.01"
                value={formData.valor_recebido}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_recebido: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão</Label>
              <Input
                id="data_emissao"
                type="date"
                value={formData.data_emissao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_emissao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento</Label>
              <Input
                id="data_vencimento"
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_liquidacao">Data de Liquidação</Label>
              <Input
                id="data_liquidacao"
                type="date"
                value={formData.data_liquidacao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_liquidacao: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacao">Situação</Label>
              <Select value={formData.situacao} onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, situacao: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {situacoes.map(situacao => (
                    <SelectItem key={situacao.value} value={situacao.value}>
                      {situacao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_documento">Número do Documento</Label>
              <Input
                id="numero_documento"
                value={formData.numero_documento}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_documento: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_banco">Número do Banco</Label>
              <Input
                id="numero_banco"
                value={formData.numero_banco}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_banco: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={formData.categoria} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, categoria: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select value={formData.forma_pagamento} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, forma_pagamento: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="historico">Histórico</Label>
            <Textarea
              id="historico"
              value={formData.historico}
              onChange={(e) => setFormData(prev => ({ ...prev, historico: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}