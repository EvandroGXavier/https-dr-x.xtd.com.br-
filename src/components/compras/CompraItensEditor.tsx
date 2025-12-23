import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Plus, Search, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ItemCompra {
  id?: string;
  codigo_produto: string;
  descricao: string;
  ncm?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  cfop?: string;
  unidade: string;
}

interface CompraItensEditorProps {
  itens: ItemCompra[];
  onChange: (itens: ItemCompra[]) => void;
  disabled?: boolean;
}

export function CompraItensEditor({ itens, onChange, disabled }: CompraItensEditorProps) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [openProduto, setOpenProduto] = useState(false);
  const [showNovoProduto, setShowNovoProduto] = useState(false);
  const [novoProduto, setNovoProduto] = useState({
    codigo_interno: '',
    descricao: '',
    ncm: '',
    unidade_principal: 'UN',
    preco_venda: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, codigo_interno, descricao, ncm, unidade_principal, preco_venda')
      .order('descricao');
    
    if (!error && data) {
      setProdutos(data);
    }
  };

  const criarNovoProduto = async () => {
    if (!novoProduto.codigo_interno || !novoProduto.descricao) {
      toast({
        title: 'Erro',
        description: 'Código e descrição são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert({
        codigo_interno: novoProduto.codigo_interno,
        descricao: novoProduto.descricao,
        ncm: novoProduto.ncm || '',
        unidade_principal: novoProduto.unidade_principal,
        preco_venda: parseFloat(novoProduto.preco_venda) || 0,
        ativo: true,
        tenant_id: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao criar produto',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Produto criado',
      description: 'Produto adicionado com sucesso!',
    });

    carregarProdutos();
    setShowNovoProduto(false);
    setNovoProduto({
      codigo_interno: '',
      descricao: '',
      ncm: '',
      unidade_principal: 'UN',
      preco_venda: ''
    });

    // Adicionar o produto aos itens
    adicionarProdutoAosItens(data);
  };

  const adicionarProdutoAosItens = (produto: any) => {
    onChange([
      ...itens,
      {
        codigo_produto: produto.codigo_interno,
        descricao: produto.descricao,
        ncm: produto.ncm || '',
        unidade: produto.unidade_principal || 'UN',
        quantidade: 1,
        valor_unitario: produto.preco_venda || 0,
        valor_total: produto.preco_venda || 0,
        cfop: '',
      },
    ]);
  };

  const adicionarItem = () => {
    onChange([
      ...itens,
      {
        codigo_produto: '',
        descricao: '',
        ncm: '',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        unidade: 'UN',
      },
    ]);
  };

  const removerItem = (index: number) => {
    onChange(itens.filter((_, i) => i !== index));
  };

  const totalItens = itens.reduce((sum, item) => sum + (item.valor_total || 0), 0);

  const atualizarItem = (index: number, campo: keyof ItemCompra, valor: any) => {
    const novosItens = [...itens];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Recalcular valor total do item
    if (campo === 'quantidade' || campo === 'valor_unitario') {
      novosItens[index].valor_total = 
        novosItens[index].quantidade * novosItens[index].valor_unitario;
    }
    
    onChange(novosItens);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Itens da Compra</Label>
        {!disabled && (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Produto
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar produto..." />
                  <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {produtos.map((produto) => (
                      <CommandItem
                        key={produto.id}
                        value={`${produto.descricao} ${produto.codigo_interno}`}
                        onSelect={() => {
                          adicionarProdutoAosItens(produto);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{produto.descricao}</span>
                          <span className="text-sm text-muted-foreground">
                            Código: {produto.codigo_interno}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <Button onClick={() => setShowNovoProduto(true)} size="sm" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
            <Button onClick={adicionarItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Item Manual
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>NCM</TableHead>
              <TableHead>Unid.</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Valor Unit.</TableHead>
              <TableHead className="text-right">Total</TableHead>
              {!disabled && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {itens.map((item, index) => (
              <TableRow key={item.id || index}>
                <TableCell>
                  <Input
                    value={item.codigo_produto}
                    onChange={(e) => atualizarItem(index, 'codigo_produto', e.target.value)}
                    disabled={disabled}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.descricao}
                    onChange={(e) => atualizarItem(index, 'descricao', e.target.value)}
                    disabled={disabled}
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.ncm || ''}
                    onChange={(e) => atualizarItem(index, 'ncm', e.target.value)}
                    disabled={disabled}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={item.unidade || 'UN'}
                    onChange={(e) => atualizarItem(index, 'unidade', e.target.value)}
                    disabled={disabled}
                    className="w-16"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantidade}
                    onChange={(e) => atualizarItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-20 text-right"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.valor_unitario}
                    onChange={(e) => atualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-24 text-right"
                  />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {item.valor_total.toFixed(2)}
                </TableCell>
                {!disabled && (
                  <TableCell>
                    <Button
                      onClick={() => removerItem(index)}
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
          Total dos Itens: R$ {totalItens.toFixed(2)}
        </div>
      </div>

      {/* Dialog para criar novo produto */}
      <Dialog open={showNovoProduto} onOpenChange={setShowNovoProduto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os dados do produto para cadastrá-lo rapidamente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={novoProduto.codigo_interno}
                  onChange={(e) => setNovoProduto({ ...novoProduto, codigo_interno: e.target.value })}
                  placeholder="Código do produto"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input
                  value={novoProduto.descricao}
                  onChange={(e) => setNovoProduto({ ...novoProduto, descricao: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>NCM</Label>
                <Input
                  value={novoProduto.ncm}
                  onChange={(e) => setNovoProduto({ ...novoProduto, ncm: e.target.value })}
                  placeholder="NCM"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select
                  value={novoProduto.unidade_principal}
                  onValueChange={(value) => setNovoProduto({ ...novoProduto, unidade_principal: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN - Unidade</SelectItem>
                    <SelectItem value="KG">KG - Quilograma</SelectItem>
                    <SelectItem value="LT">LT - Litro</SelectItem>
                    <SelectItem value="MT">MT - Metro</SelectItem>
                    <SelectItem value="CX">CX - Caixa</SelectItem>
                    <SelectItem value="PC">PC - Peça</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço Venda</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoProduto.preco_venda}
                  onChange={(e) => setNovoProduto({ ...novoProduto, preco_venda: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoProduto(false)}>
              Cancelar
            </Button>
            <Button onClick={criarNovoProduto}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
