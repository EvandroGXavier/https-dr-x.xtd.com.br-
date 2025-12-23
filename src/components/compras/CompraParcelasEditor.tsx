import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';

interface Parcela {
  id?: string;
  numero_parcela: number;
  data_vencimento: string;
  valor: number;
  historico?: string;
  categoria?: string;
  forma_pagamento?: string;
}

interface CompraParcelasEditorProps {
  parcelas: Parcela[];
  onChange: (parcelas: Parcela[]) => void;
  disabled?: boolean;
}

export function CompraParcelasEditor({ parcelas, onChange, disabled }: CompraParcelasEditorProps) {
  const adicionarParcela = () => {
    const proximoNumero = parcelas.length > 0 
      ? Math.max(...parcelas.map(p => p.numero_parcela)) + 1 
      : 1;
    
    onChange([
      ...parcelas,
      {
        numero_parcela: proximoNumero,
        data_vencimento: new Date().toISOString().split('T')[0],
        valor: 0,
        historico: `Parcela ${proximoNumero} - Compra`,
        categoria: 'fornecedores',
        forma_pagamento: 'boleto',
      },
    ]);
  };

  const removerParcela = (index: number) => {
    onChange(parcelas.filter((_, i) => i !== index));
  };

  const atualizarParcela = (index: number, campo: keyof Parcela, valor: any) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index] = { ...novasParcelas[index], [campo]: valor };
    onChange(novasParcelas);
  };

  const totalParcelas = parcelas.reduce((sum, p) => sum + (p.valor || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Parcelas de Pagamento</Label>
        {!disabled && (
          <Button onClick={adicionarParcela} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Parcela
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Parcela</TableHead>
              <TableHead className="w-[150px]">Vencimento</TableHead>
              <TableHead>Histórico</TableHead>
              <TableHead className="w-[140px]">Categoria</TableHead>
              <TableHead className="w-[140px]">Forma Pgto</TableHead>
              <TableHead className="w-[120px] text-right">Valor (R$)</TableHead>
              {!disabled && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parcelas.map((parcela, index) => (
              <TableRow key={parcela.id || index}>
                <TableCell>
                  <Input
                    type="number"
                    value={parcela.numero_parcela}
                    onChange={(e) => atualizarParcela(index, 'numero_parcela', parseInt(e.target.value) || 1)}
                    disabled={disabled}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="date"
                    value={parcela.data_vencimento}
                    onChange={(e) => atualizarParcela(index, 'data_vencimento', e.target.value)}
                    disabled={disabled}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={parcela.historico || ''}
                    onChange={(e) => atualizarParcela(index, 'historico', e.target.value)}
                    disabled={disabled}
                    placeholder="Descrição da parcela"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={parcela.categoria || 'fornecedores'}
                    onValueChange={(value) => atualizarParcela(index, 'categoria', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fornecedores">Fornecedores</SelectItem>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="impostos">Impostos</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={parcela.forma_pagamento || 'boleto'}
                    onValueChange={(value) => atualizarParcela(index, 'forma_pagamento', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={parcela.valor}
                    onChange={(e) => atualizarParcela(index, 'valor', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-full text-right"
                  />
                </TableCell>
                {!disabled && (
                  <TableCell>
                    <Button
                      onClick={() => removerParcela(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="text-sm font-semibold">
          Total das Parcelas: R$ {totalParcelas.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
