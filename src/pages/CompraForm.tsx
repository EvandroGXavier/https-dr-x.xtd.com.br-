import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Settings } from 'lucide-react';
import { useCompras } from '@/hooks/useCompras';
import { CompraItensEditor } from '@/components/compras/CompraItensEditor';
import { CompraParcelasEditor } from '@/components/compras/CompraParcelasEditor';
import { ItemCompra } from '@/hooks/useCompras';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

export default function CompraForm() {
  const navigate = useNavigate();
  const { createCompra, isCreating } = useCompras();
  const [openConfig, setOpenConfig] = useState(false);
  
  // Configuração: mostrar apenas fornecedores com etiqueta
  const { valor: filtrarEtiqueta, saveConfig: saveFiltrarEtiqueta, loading: loadingConfig } = 
    useConfiguracoes('compras_filtrar_etiqueta_fornecedor');

  const [formData, setFormData] = useState({
    fornecedor_id: '',
    tipo: 'consumo' as 'consumo' | 'revenda' | 'servico',
    numero_nfe: '',
    chave_nfe: '',
    data_emissao: new Date().toISOString().split('T')[0],
    valor_total: 0,
    status: 'pendente' as 'pendente' | 'aprovada' | 'cancelada',
    observacoes: '',
  });

  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);

  // Buscar fornecedores com meios de contato e etiqueta "Fornecedor"
  const mostrarApenasComEtiqueta = filtrarEtiqueta === 'true';
  
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores', mostrarApenasComEtiqueta],
    queryFn: async () => {
      let contatoIds: string[] | null = null;

        // Se configurado para filtrar por etiqueta
        if (mostrarApenasComEtiqueta) {
          // Buscar a etiqueta "Fornecedor"
          const { data: etiquetaData } = await supabase
            .from('etiquetas')
            .select('id')
            .eq('nome', 'Fornecedor')
            .single();

          if (etiquetaData) {
            // Buscar contatos vinculados à etiqueta "Fornecedor"
            const { data: vinculos } = await supabase
              .from('etiqueta_vinculos')
              .select('referencia_id')
              .eq('etiqueta_id', etiquetaData.id)
              .eq('referencia_tipo', 'contato');

            if (vinculos && vinculos.length > 0) {
              contatoIds = vinculos.map((v) => v.referencia_id);
            } else {
              // Se não houver vínculos, não aplicar filtro para evitar lista vazia
              contatoIds = null;
            }
          } else {
            // Se etiqueta não existir ou não acessível, não aplicar filtro
            contatoIds = null;
          }
        }

      // Buscar contatos com meios de contato
      let query = supabase
        .from('contatos_v2')
        .select(`
          id, 
          nome_fantasia, 
          cpf_cnpj,
          contato_meios_contato(tipo, valor)
        `);

      // Aplicar filtro por IDs se necessário
      if (contatoIds) {
        query = query.in('id', contatoIds);
      }

      const { data, error } = await query.order('nome_fantasia');
      
      if (error) throw error;
      
      // Processar para incluir celular
      return data.map(f => ({
        ...f,
        celular: f.contato_meios_contato?.find((m: any) => m.tipo === 'Celular')?.valor || ''
      }));
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = () => {
    // Validações básicas
    if (!formData.fornecedor_id) {
      alert('Selecione um fornecedor');
      return;
    }

    if (itens.length === 0) {
      alert('Adicione pelo menos um item');
      return;
    }

    if (parcelas.length === 0) {
      alert('Adicione pelo menos uma parcela');
      return;
    }

    // Calcular valor total dos itens
    const valorTotalItens = itens.reduce((sum, item) => sum + item.valor_total, 0);

    createCompra(
      {
        compra: {
          ...formData,
          valor_total: valorTotalItens,
        },
        itens,
        parcelas,
      },
      {
        onSuccess: () => {
          navigate('/compras');
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/compras')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Nova Compra</h1>
              <p className="text-muted-foreground mt-1">Registrar entrada manual de compra</p>
            </div>
          </div>
          <Dialog open={openConfig} onOpenChange={setOpenConfig}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Configurações da Tela de Compras">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurações da Tela de Compras</DialogTitle>
                <DialogDescription>Ajuste filtros e preferências desta tela.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filtrar-etiqueta"
                    checked={mostrarApenasComEtiqueta}
                    onCheckedChange={(checked) => {
                      const value = checked === true ? 'true' : 'false'
                      saveFiltrarEtiqueta(value)
                    }}
                    disabled={loadingConfig}
                  />
                  <Label htmlFor="filtrar-etiqueta" className="cursor-pointer">
                    Mostrar somente contatos com etiqueta de Fornecedor
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando marcado, apenas contatos com a etiqueta "Fornecedor" serão exibidos na lista de fornecedores.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Fornecedor *</Label>
                </div>
                <Select
                  value={formData.fornecedor_id}
                  onValueChange={(value) => handleChange('fornecedor_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor: any) => (
                      <SelectItem 
                        key={fornecedor.id} 
                        value={fornecedor.id}
                      >
                        {fornecedor.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Compra *</Label>
                <Select value={formData.tipo} onValueChange={(value: any) => handleChange('tipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumo">Consumo</SelectItem>
                    <SelectItem value="revenda">Revenda</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número NF-e</Label>
                <Input
                  value={formData.numero_nfe}
                  onChange={(e) => handleChange('numero_nfe', e.target.value)}
                  placeholder="Ex: 12345"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de Emissão *</Label>
                <Input
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => handleChange('data_emissao', e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Chave NF-e</Label>
                <Input
                  value={formData.chave_nfe}
                  onChange={(e) => handleChange('chave_nfe', e.target.value)}
                  placeholder="44 dígitos da chave de acesso"
                  maxLength={44}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre a compra..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <CompraItensEditor itens={itens} onChange={setItens} disabled={false} />

        <CompraParcelasEditor parcelas={parcelas} onChange={setParcelas} disabled={false} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/compras')} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isCreating}>
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Salvando...' : 'Salvar Compra'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
