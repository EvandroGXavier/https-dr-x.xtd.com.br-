import { useState } from 'react';
import { Plus, Filter, Search, Calendar, Download, Printer, Mail, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FinanceiroStats } from '@/components/financeiro/FinanceiroStats';
import { FinanceiroTable } from '@/components/financeiro/FinanceiroTable';
import { FinanceiroFilters } from '@/components/financeiro/FinanceiroFilters';
import { NovaTransacaoDialog } from '@/components/financeiro/NovaTransacaoDialog';
import { TagFilter } from '@/components/etiquetas/TagFilter';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinanceiroFilters as IFinanceiroFilters } from '@/types/financeiro';

export default function Financeiro() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNovaTransacao, setShowNovaTransacao] = useState(false);
  const [selectedTab, setSelectedTab] = useState('todas');
  const [tagFilters, setTagFilters] = useState<{ equals: string[]; notEquals: string[] }>({ 
    equals: [], 
    notEquals: [] 
  });
  const [activeCardFilters, setActiveCardFilters] = useState<any>(null);

  const handleCardFilterClick = (cardFilters: any) => {
    setActiveCardFilters(cardFilters);
    if (cardFilters.tipo && cardFilters.tipo !== 'todas') {
      setSelectedTab(cardFilters.tipo);
    }
  };

  const clearFilters = () => {
    setActiveCardFilters(null);
    setSelectedTab('todas');
    setSearchTerm('');
    setTagFilters({ equals: [], notEquals: [] });
  };

  const filters: IFinanceiroFilters = {
    searchTerm,
    tipo: selectedTab as any,
    tagsEquals: tagFilters.equals,
    tagsNotEquals: tagFilters.notEquals,
    ...activeCardFilters,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">
            Controle completo de contas a receber e pagar
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/financeiro/contas'}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Contas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => setShowNovaTransacao(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <FinanceiroStats onFilterClick={handleCardFilterClick} />

      {/* Active Filters Display */}
      {activeCardFilters && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Filtro ativo:
                </span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {activeCardFilters.tipo === 'a-receber' && activeCardFilters.vencidas ? 'Contas a Receber Vencidas' :
                   activeCardFilters.tipo === 'a-pagar' && activeCardFilters.vencidas ? 'Contas a Pagar Vencidas' :
                   activeCardFilters.tipo === 'a-receber' ? 'Contas a Receber Abertas' :
                   activeCardFilters.tipo === 'a-pagar' ? 'Contas a Pagar Abertas' :
                   activeCardFilters.tipo === 'recebidas' ? 'Contas Recebidas' :
                   activeCardFilters.tipo === 'pagas' ? 'Contas Pagas' :
                   activeCardFilters.saldoRealizar ? 'Saldo a Realizar' : 'Filtro Personalizado'}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4">
          <FinanceiroFilters />
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3">Filtros por Etiquetas</h3>
              <TagFilter
                value=""
                onChange={() => {}}
                comTags={tagFilters.equals}
                semTags={tagFilters.notEquals}
                onComTagsChange={(tags) => setTagFilters(prev => ({ ...prev, equals: tags }))}
                onSemTagsChange={(tags) => setTagFilters(prev => ({ ...prev, notEquals: tags }))}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por contato, CPF/CNPJ, número ou histórico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Período
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="a-receber">A Receber</TabsTrigger>
          <TabsTrigger value="a-pagar">A Pagar</TabsTrigger>
          <TabsTrigger value="recebidas">Recebidas</TabsTrigger>
          <TabsTrigger value="pagas">Pagas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          <FinanceiroTable filters={filters} />
        </TabsContent>

        <TabsContent value="a-receber" className="space-y-4">
          <FinanceiroTable filters={{ ...filters, tipo: 'a-receber' }} />
        </TabsContent>

        <TabsContent value="a-pagar" className="space-y-4">
          <FinanceiroTable filters={{ ...filters, tipo: 'a-pagar' }} />
        </TabsContent>

        <TabsContent value="recebidas" className="space-y-4">
          <FinanceiroTable filters={{ ...filters, tipo: 'recebidas' }} />
        </TabsContent>

        <TabsContent value="pagas" className="space-y-4">
          <FinanceiroTable filters={{ ...filters, tipo: 'pagas' }} />
        </TabsContent>
      </Tabs>

      {/* Dialog para Nova Transação */}
      <NovaTransacaoDialog 
        open={showNovaTransacao} 
        onOpenChange={setShowNovaTransacao} 
      />
      </div>
    </AppLayout>
  );
}