import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProdutos } from '@/hooks/useProdutos';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Package, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ProdutosGrid() {
  const { produtos, isLoading, createProduto, isCreating } = useProdutos();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    codigo_interno: '',
    descricao: '',
    tipo: 'produto' as 'produto' | 'servico',
    unidade_principal: 'UN',
    preco_venda: '',
    controla_estoque: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduto(
      {
        nome: form.descricao,
        sku: form.codigo_interno || undefined,
        preco_base: form.preco_venda ? parseFloat(form.preco_venda) : 0,
        status: 'ativo' as const,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setForm({
            codigo_interno: '',
            descricao: '',
            tipo: 'produto',
            unidade_principal: 'UN',
            preco_venda: '',
            controla_estoque: true,
          });
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lista de Produtos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={form.codigo_interno}
                  onChange={(e) =>
                    setForm({ ...form, codigo_interno: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(value: 'produto' | 'servico') =>
                    setForm({ ...form, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  value={form.unidade_principal}
                  onChange={(e) =>
                    setForm({ ...form, unidade_principal: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço de Venda</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={form.preco_venda}
                  onChange={(e) =>
                    setForm({ ...form, preco_venda: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      ) : !produtos || produtos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          Nenhum produto cadastrado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Preço Base</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell className="font-mono text-sm">
                  {produto.sku || '-'}
                </TableCell>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {produto.marca?.nome || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {produto.categoria?.nome || '-'}
                </TableCell>
                <TableCell>{produto.unidade?.sigla || '-'}</TableCell>
                <TableCell className="font-medium">
                  {produto.preco_base
                    ? formatCurrency(produto.preco_base)
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={produto.quantidade_estoque && produto.quantidade_estoque > 0 ? 'default' : 'secondary'}>
                    {produto.quantidade_estoque || 0} {produto.unidade?.sigla || 'UN'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
