import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useProcessos, type ProcessoStatus, type ProcessoTipo } from "@/hooks/useProcessos";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  Scale,
  Building
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExportButton } from "@/components/ui/export-button";
import { ItemEtiquetasInline } from "@/components/etiquetas/ItemEtiquetasInline";

// Mapeamento de status para exibição legível
const statusLabels: Record<string, string> = {
  // Status antigos
  'ativo': 'Ativo',
  'suspenso': 'Suspenso',
  'arquivado': 'Arquivado',
  'finalizado': 'Finalizado',
  // Novos status do Kanban
  'Oportunidade': 'Oportunidade',
  'Em Análise': 'Em Análise',
  'Aguardando Cliente': 'Aguardando Cliente',
  'Ativo': 'Ativo',
  'Suspenso': 'Suspenso',
  'Encerrado': 'Encerrado',
  'Recusado': 'Recusado'
};

const statusColors: Record<string, string> = {
  // Status antigos
  'ativo': "bg-success/10 text-success hover:bg-success/20 border-success/20",
  'suspenso': "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20", 
  'arquivado': "bg-muted/10 text-muted-foreground hover:bg-muted/20 border-muted/20",
  'finalizado': "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
  // Novos status do Kanban
  'Oportunidade': "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20",
  'Em Análise': "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-purple-500/20",
  'Aguardando Cliente': "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20",
  'Ativo': "bg-success/10 text-success hover:bg-success/20 border-success/20",
  'Suspenso': "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20",
  'Encerrado': "bg-muted/10 text-muted-foreground hover:bg-muted/20 border-muted/20",
  'Recusado': "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
};

const tipoLabels: Record<ProcessoTipo, string> = {
  civel: "Cível",
  criminal: "Criminal",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  outros: "Outros"
};

interface TagFilters {
  comTags: string[];
  semTags: string[];
}

interface ProcessosDataTableProps {
  onCreateNew: () => void;
  tagFilters?: TagFilters;
}

export function ProcessosDataTable({ onCreateNew, tagFilters }: ProcessosDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProcessoStatus | "">("");
  const [tipoFilter, setTipoFilter] = useState<ProcessoTipo | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("titulo");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isExporting, setIsExporting] = useState(false);
  
  const { processos, isLoading, deleteProcesso } = useProcessos();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const pageSize = 20;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para extrair texto limpo do HTML
  const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const filteredProcessos = useMemo(() => {
    return processos.filter(processo => {
      const searchMatch = !searchTerm || 
        processo.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = !statusFilter || processo.status === statusFilter;
      
      // Filtro de etiquetas
      let tagMatch = true;
      if (tagFilters?.comTags?.length || tagFilters?.semTags?.length) {
        const processoTags = (processo as any).etiquetas?.map((tag: any) => tag.nome) || [];
        
        // Deve ter TODAS as etiquetas da lista "COM"
        if (tagFilters.comTags?.length > 0) {
          tagMatch = tagMatch && tagFilters.comTags.every(tag => processoTags.includes(tag));
        }
        
        // NÃO deve ter NENHUMA das etiquetas da lista "SEM"
        if (tagFilters.semTags?.length > 0) {
          tagMatch = tagMatch && !tagFilters.semTags.some(tag => processoTags.includes(tag));
        }
      }
      
      return searchMatch && statusMatch && tagMatch;
    });
  }, [processos, searchTerm, statusFilter, tipoFilter, tagFilters]);

  const sortedProcessos = useMemo(() => {
    return [...filteredProcessos].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a] || '';
      const bValue = b[sortField as keyof typeof b] || '';
      
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredProcessos, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedProcessos.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProcessos = useMemo(() => {
    return sortedProcessos.slice(startIndex, startIndex + pageSize);
  }, [sortedProcessos, startIndex, pageSize]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (processo: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o caso "${processo.titulo}"?`)) {
      try {
        await deleteProcesso(processo.id);
      } catch (error) {
        console.error('Erro ao excluir processo:', error);
      }
    }
  };

  // Preparar dados para exportação
  const exportHeaders = [
    { key: 'titulo', label: 'Título' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'status', label: 'Status' },
    { key: 'local', label: 'Local' },
    { key: 'created_at', label: 'Data de Cadastro' },
  ];

  const exportData = filteredProcessos.map(processo => ({
    ...processo,
    created_at: format(new Date(processo.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
  }));

  const totalProcessos = filteredProcessos.length;
  const totalAtivos = filteredProcessos.filter(p => p.status === 'Ativo').length;
  const totalFinalizados = filteredProcessos.filter(p => p.status === 'Encerrado').length;
  const totalOportunidades = filteredProcessos.filter(p => p.status === 'Oportunidade').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Processos Jurídicos</h1>
          <p className="text-muted-foreground">Gerencie todos os seus processos</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={exportData as any[]}
            fileName="processos"
            headers={exportHeaders as any[]}
            title="Relatório de Processos"
            orientation="landscape"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalProcessos}</p>
              </div>
              <Scale className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{totalAtivos}</p>
              </div>
              <FileText className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-bold">{totalFinalizados}</p>
              </div>
              <Building className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold">{totalOportunidades}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número, assunto ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value as ProcessoStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Oportunidade">Oportunidade</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Aguardando Cliente">Aguardando Cliente</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Encerrado">Encerrado</SelectItem>
                  <SelectItem value="Recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer w-[30%]" onClick={() => handleSort('titulo')}>
                    Título {sortField === 'titulo' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="w-[25%]">Descrição</TableHead>
                  <TableHead className="w-[20%]">Etiquetas</TableHead>
                  <TableHead className="cursor-pointer w-[15%]" onClick={() => handleSort('status')}>
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer w-[15%]" onClick={() => handleSort('updated_at')}>
                    Atualizado {sortField === 'updated_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="w-[10%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProcessos.map((processo) => (
                  <TableRow 
                    key={processo.id} 
                    className="odd:bg-muted/50 cursor-pointer"
                    onDoubleClick={() => navigate(`/processos/${processo.id}`)}
                  >
                    <TableCell className="font-medium max-w-[300px]">
                      <div className="truncate" title={processo.titulo}>
                        {processo.titulo}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="truncate text-muted-foreground" title={stripHtml(processo.descricao)}>
                        {stripHtml(processo.descricao) || '—'}
                      </div>
                    </TableCell>
                     <TableCell>
                       <ItemEtiquetasInline
                         itemId={processo.id}
                         itemType="processos"
                         itemTags={(processo as any).etiquetas || []}
                         onTagsChange={() => queryClient.invalidateQueries({ queryKey: ["processos"] })}
                       />
                     </TableCell>
                     <TableCell>
                       <Badge 
                         variant="outline" 
                         className={statusColors[processo.status] || "bg-muted/10 text-muted-foreground"}
                       >
                         {statusLabels[processo.status] || processo.status}
                       </Badge>
                     </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(processo.updated_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/processos/${processo.id}`}>
                          <Button variant="ghost" size="sm" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/processos/${processo.id}`}>
                          <Button variant="ghost" size="sm" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(processo)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {paginatedProcessos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum processo encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + pageSize, sortedProcessos.length)} de {sortedProcessos.length} processos
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}