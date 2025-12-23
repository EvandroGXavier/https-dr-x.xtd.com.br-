import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComprasGrid } from '@/components/estoque/ComprasGrid';
import { VendasGrid } from '@/components/estoque/VendasGrid';
import { ProdutosGrid } from '@/components/estoque/ProdutosGrid';
import { MovimentacoesGrid } from '@/components/estoque/MovimentacoesGrid';
import { useTabsEstoqueState } from '@/hooks/useTabsEstoqueState';

export default function Estoque() {
  const { tab, setTab } = useTabsEstoqueState();
  const [produtoTab, setProdutoTab] = useState('lista');

  return (
    <AppLayout>
      <div className="p-6 space-y-4">
        <header className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h1 className="text-2xl font-bold">Painel de Estoque</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie compras, vendas, produtos e movimentações em um só lugar
            </p>
          </div>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="sticky top-0 bg-background z-10 shadow-sm">
            <TabsTrigger value="compras">Compras</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          <TabsContent value="compras" className="mt-4">
            <ComprasGrid />
          </TabsContent>

          <TabsContent value="vendas" className="mt-4">
            <VendasGrid />
          </TabsContent>

          <TabsContent value="produtos" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  variant={produtoTab === 'lista' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProdutoTab('lista')}
                >
                  Listagem
                </Button>
                <Button
                  variant={produtoTab === 'mov' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProdutoTab('mov')}
                >
                  Movimentações
                </Button>
              </div>
            </div>

            {produtoTab === 'lista' && <ProdutosGrid />}
            {produtoTab === 'mov' && <MovimentacoesGrid />}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
