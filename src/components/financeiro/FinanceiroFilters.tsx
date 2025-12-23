import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';

export function FinanceiroFilters() {
  const [filters, setFilters] = useState({
    situacao: '',
    categoria: '',
    conta_financeira: '',
    forma_pagamento: '',
    valor_min: '',
    valor_max: '',
    data_range: null as any
  });

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const situacoes = [
    { value: 'aberta', label: 'Aberta' },
    { value: 'recebida', label: 'Recebida' },
    { value: 'paga', label: 'Paga' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const categorias = [
    { value: 'servicos', label: 'Serviços' },
    { value: 'produtos', label: 'Produtos' },
    { value: 'cobranca', label: 'Cobrança' },
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'fornecedores', label: 'Fornecedores' },
    { value: 'impostos', label: 'Impostos' },
    { value: 'outros', label: 'Outros' }
  ];

  const contasFinanceiras = [
    { value: 'banco_bradesco', label: 'Banco Bradesco' },
    { value: 'pix_itau', label: 'PIX Itaú' },
    { value: 'banco_bb', label: 'Banco do Brasil' },
    { value: 'nubank', label: 'Nubank' },
    { value: 'caixa', label: 'Caixa Econômica' }
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    if (value && !activeFilters.includes(key)) {
      setActiveFilters(prev => [...prev, key]);
    } else if (!value && activeFilters.includes(key)) {
      setActiveFilters(prev => prev.filter(f => f !== key));
    }
  };

  const removeFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: key === 'data_range' ? null : '' }));
    setActiveFilters(prev => prev.filter(f => f !== key));
  };

  const clearAllFilters = () => {
    setFilters({
      situacao: '',
      categoria: '',
      conta_financeira: '',
      forma_pagamento: '',
      valor_min: '',
      valor_max: '',
      data_range: null
    });
    setActiveFilters([]);
  };

  const getFilterLabel = (key: string, value: any) => {
    switch (key) {
      case 'situacao':
        return situacoes.find(s => s.value === value)?.label || value;
      case 'categoria':
        return categorias.find(c => c.value === value)?.label || value;
      case 'conta_financeira':
        return contasFinanceiras.find(c => c.value === value)?.label || value;
      case 'forma_pagamento':
        return formasPagamento.find(f => f.value === value)?.label || value;
      case 'valor_min':
        return `Valor mín: R$ ${value}`;
      case 'valor_max':
        return `Valor máx: R$ ${value}`;
      case 'data_range':
        return 'Período selecionado';
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filtros Avançados</CardTitle>
          {activeFilters.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Limpar todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map(key => (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {getFilterLabel(key, filters[key as keyof typeof filters])}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter(key)}
                />
              </Badge>
            ))}
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="situacao">Situação</Label>
            <Select value={filters.situacao} onValueChange={(value) => handleFilterChange('situacao', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as situações" />
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
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={filters.categoria} onValueChange={(value) => handleFilterChange('categoria', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
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
            <Label htmlFor="conta_financeira">Conta Financeira</Label>
            <Select value={filters.conta_financeira} onValueChange={(value) => handleFilterChange('conta_financeira', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                {contasFinanceiras.map(conta => (
                  <SelectItem key={conta.value} value={conta.value}>
                    {conta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
            <Select value={filters.forma_pagamento} onValueChange={(value) => handleFilterChange('forma_pagamento', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as formas" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valor_min">Valor Mínimo</Label>
            <Input
              id="valor_min"
              type="number"
              placeholder="0,00"
              value={filters.valor_min}
              onChange={(e) => handleFilterChange('valor_min', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_max">Valor Máximo</Label>
            <Input
              id="valor_max"
              type="number"
              placeholder="0,00"
              value={filters.valor_max}
              onChange={(e) => handleFilterChange('valor_max', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarDays className="mr-2 h-4 w-4" />
              Selecionar período
            </Button>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button>Aplicar Filtros</Button>
          <Button variant="outline">Salvar Filtro</Button>
        </div>
      </CardContent>
    </Card>
  );
}