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
import { ArrowLeft, Save } from 'lucide-react';
import { useVendas, ItemVenda } from '@/hooks/useVendas';
import { CompraItensEditor } from '@/components/compras/CompraItensEditor';
import { CompraParcelasEditor } from '@/components/compras/CompraParcelasEditor';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function VendaForm() {
  const navigate = useNavigate();
  const { createVenda, isCreating } = useVendas();

  const [formData, setFormData] = useState({
    fornecedor_id: '', // cliente
    tipo: 'venda',
    numero_nfe: '',
    chave_nfe: '',
    data_emissao: new Date().toISOString().split('T')[0],
    valor_total: 0,
    status: 'pendente' as 'pendente' | 'aprovada' | 'cancelada',
    observacoes: '',
  });

  const [itens, setItens] = useState<ItemVenda[]>([]);
  const [parcelas, setParcelas] = useState<any[]>([]);

  // Buscar clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contatos_v2')
        .select('id, nome_fantasia, cpf_cnpj')
        .order('nome_fantasia');
      
      if (error) throw error;
      return data;
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSalvar = () => {
    // Validações básicas
    if (!formData.fornecedor_id) {
      alert('Selecione um cliente');
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

    createVenda(
      {
        venda: {
          ...formData,
          valor_total: valorTotalItens,
        },
        itens,
        parcelas,
      },
      {
        onSuccess: () => {
          navigate('/vendas');
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/vendas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Venda</h1>
            <p className="text-muted-foreground mt-1">Registrar saída de venda</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={formData.fornecedor_id}
                  onValueChange={(value) => handleChange('fornecedor_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome_fantasia}
                      </SelectItem>
                    ))}
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
                  placeholder="Informações adicionais sobre a venda..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <CompraItensEditor itens={itens} onChange={setItens} disabled={false} />

        <CompraParcelasEditor parcelas={parcelas} onChange={setParcelas} disabled={false} />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/vendas')} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={isCreating}>
            <Save className="h-4 w-4 mr-2" />
            {isCreating ? 'Salvando...' : 'Salvar Venda'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
