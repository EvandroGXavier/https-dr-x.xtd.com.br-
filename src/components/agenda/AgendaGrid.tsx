import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemEtiquetasInline } from "@/components/etiquetas/ItemEtiquetasInline";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Edit, Trash2, MoreHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AgendaEvent } from "@/hooks/useAgendaV2List";

interface AgendaGridProps {
  data: AgendaEvent[];
  onEdit?: (agenda: AgendaEvent) => void;
  onDelete?: (id: string) => void;
}

type SortField = 'titulo' | 'status' | 'data_inicio' | 'responsavel_nome' | 'prioridade';
type SortDirection = 'asc' | 'desc';

const getStatusVariant = (status: string) => {
  switch (status) {
    case "analise":
      return "secondary";
    case "a_fazer":
      return "outline";
    case "fazendo":
      return "default";
    case "feito":
      return "success" as any;
    default:
      return "secondary";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "analise":
      return "Em Análise";
    case "a_fazer":
      return "A Fazer";
    case "fazendo":
      return "Fazendo";
    case "feito":
      return "Concluído";
    default:
      return status;
  }
};

const getPriorityVariant = (prioridade: string) => {
  switch (prioridade) {
    case "alta":
      return "destructive";
    case "media":
      return "default";
    case "baixa":
      return "secondary";
    default:
      return "secondary";
  }
};

export function AgendaGrid({ data, onEdit, onDelete }: AgendaGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortField, setSortField] = useState<SortField>('data_inicio');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filtrar e ordenar dados
  const filteredData = data
    .filter(agenda => {
      const matchesSearch = searchTerm === "" || 
        agenda.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agenda.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'todos' || agenda.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'data_inicio') {
        aValue = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
        bValue = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
      }
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };


  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta agenda?')) return;
    
    try {
      const { error } = await supabase
        .from('agendas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Agenda excluída com sucesso",
      });
      
      queryClient.invalidateQueries({ queryKey: ["agendas-v2"] });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir agenda",
        variant: "destructive",
      });
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold mb-2">Nenhuma agenda encontrada</h3>
          <p className="text-muted-foreground text-center mb-4">
            Comece criando sua primeira agenda para organizar suas tarefas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="analise">Em Análise</SelectItem>
                  <SelectItem value="a_fazer">A Fazer</SelectItem>
                  <SelectItem value="fazendo">Fazendo</SelectItem>
                  <SelectItem value="feito">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[120px]">
              <label className="text-sm font-medium mb-2 block">Itens/Página</label>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('titulo')} className="flex items-center gap-2">
                    Título
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('status')} className="flex items-center gap-2">
                    Status
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('prioridade')} className="flex items-center gap-2">
                    Prioridade
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('data_inicio')} className="flex items-center gap-2">
                    Data Início
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort('responsavel_nome')} className="flex items-center gap-2">
                    Responsável
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Etiquetas</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((agenda) => (
                <TableRow 
                  key={agenda.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onDoubleClick={() => navigate(`/agenda/v2/${agenda.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{agenda.titulo}</span>
                        {(agenda as any).origem_config_id && (
                          <Badge variant="outline" className="text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                      {agenda.descricao && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {agenda.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(agenda.status)}>
                      {getStatusLabel(agenda.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {agenda.prioridade && (
                      <Badge variant={getPriorityVariant(agenda.prioridade)}>
                        {agenda.prioridade}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {agenda.data_inicio 
                      ? format(new Date(agenda.data_inicio), "dd/MM/yy HH:mm", { locale: ptBR })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {agenda.responsavel_nome || '-'}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ItemEtiquetasInline
                      itemId={agenda.id}
                      itemType="agendas"
                      itemTags={agenda.etiquetas || []}
                      onTagsChange={() => {
                        queryClient.invalidateQueries({ queryKey: ["agendas-v2"] });
                        queryClient.invalidateQueries({ queryKey: ["etiqueta_vinculos"] });
                      }}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/agenda/v2/${agenda.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(agenda.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
