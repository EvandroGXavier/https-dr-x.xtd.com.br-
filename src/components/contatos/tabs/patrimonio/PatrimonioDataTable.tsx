import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, TrendingUp, TrendingDown, Loader2, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Patrimonio } from "@/types/patrimonio";
import { usePatrimonios } from "@/hooks/usePatrimonios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ItemEtiquetasInline } from "@/components/etiquetas/ItemEtiquetasInline";
import { useEtiquetaVinculos } from "@/hooks/useEtiquetas";

interface PatrimonioDataTableProps {
  patrimonios: Patrimonio[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  comTags?: string[];
  semTags?: string[];
}

type SortField = 'descricao' | 'natureza' | 'valor_saldo' | 'data_vinculo' | 'status';
type SortDirection = 'asc' | 'desc';

export const PatrimonioDataTable = ({
  patrimonios,
  isLoading,
  onEdit,
  comTags = [],
  semTags = [],
}: PatrimonioDataTableProps) => {
  const { deletePatrimonio } = usePatrimonios();
  const [sortField, setSortField] = useState<SortField>('descricao');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const formatCurrency = (value?: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este patrimônio?")) {
      await deletePatrimonio(id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => handleSort(field)}>
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  // Filtrar e ordenar patrimônios - DEVE vir ANTES de qualquer return condicional
  const filteredAndSortedPatrimonios = useMemo(() => {
    // Primeiro, filtrar por tags
    let filtered = patrimonios;

    // Aplicar ordenação
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'descricao':
          comparison = (a.descricao || '').localeCompare(b.descricao || '');
          break;
        case 'natureza':
          comparison = (a.natureza || '').localeCompare(b.natureza || '');
          break;
        case 'valor_saldo':
          comparison = (a.valor_saldo || 0) - (b.valor_saldo || 0);
          break;
        case 'data_vinculo':
          const dateA = a.data_vinculo ? new Date(a.data_vinculo).getTime() : 0;
          const dateB = b.data_vinculo ? new Date(b.data_vinculo).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [patrimonios, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (patrimonios.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Nenhum patrimônio cadastrado
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <SortableHeader field="descricao">Descrição</SortableHeader>
            <SortableHeader field="natureza">Natureza</SortableHeader>
            <SortableHeader field="valor_saldo">Valor/Saldo</SortableHeader>
            <SortableHeader field="data_vinculo">Data Vínculo</SortableHeader>
            <SortableHeader field="status">Status</SortableHeader>
            <TableHead>Etiquetas</TableHead>
            <TableHead className="w-16">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAndSortedPatrimonios.map((patrimonio) => (
            <PatrimonioRow
              key={patrimonio.id}
              patrimonio={patrimonio}
              onEdit={onEdit}
              onDelete={handleDelete}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              comTags={comTags}
              semTags={semTags}
              sortField={sortField}
              sortDirection={sortDirection}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface PatrimonioRowProps {
  patrimonio: Patrimonio;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value?: number | null) => string;
  formatDate: (dateString?: string | null) => string;
  comTags: string[];
  semTags: string[];
  sortField: SortField;
  sortDirection: SortDirection;
}

const PatrimonioRow = ({
  patrimonio,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
  comTags,
  semTags,
}: PatrimonioRowProps) => {
  const { vinculos } = useEtiquetaVinculos('patrimonio', patrimonio.id);

  const itemTags = vinculos.map((v) => ({
    nome: v.etiqueta.nome,
    cor: v.etiqueta.cor,
    icone: v.etiqueta.icone,
  }));

  // Aplicar filtros de etiquetas
  const shouldShow = useMemo(() => {
    // Filtro COM tags
    if (comTags.length > 0) {
      const hasAllComTags = comTags.every(tag =>
        itemTags.some(itemTag => itemTag.nome.toLowerCase() === tag.toLowerCase())
      );
      if (!hasAllComTags) return false;
    }

    // Filtro SEM tags
    if (semTags.length > 0) {
      const hasAnySemTag = semTags.some(tag =>
        itemTags.some(itemTag => itemTag.nome.toLowerCase() === tag.toLowerCase())
      );
      if (hasAnySemTag) return false;
    }

    return true;
  }, [itemTags, comTags, semTags]);

  if (!shouldShow) return null;

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onDoubleClick={() => onEdit(patrimonio.id)}
    >
      <TableCell>
        {patrimonio.natureza === 'DIREITO' ? (
          <TrendingUp className="h-5 w-5 text-success" />
        ) : (
          <TrendingDown className="h-5 w-5 text-destructive" />
        )}
      </TableCell>
      <TableCell className="font-medium">{patrimonio.descricao}</TableCell>
      <TableCell>
        <Badge variant={patrimonio.natureza === 'DIREITO' ? 'default' : 'secondary'}>
          {patrimonio.natureza}
        </Badge>
      </TableCell>
      <TableCell>{formatCurrency(patrimonio.valor_saldo)}</TableCell>
      <TableCell>{formatDate(patrimonio.data_vinculo)}</TableCell>
      <TableCell>
        <Badge variant={patrimonio.status === 'ATIVO' ? 'default' : 'outline'}>
          {patrimonio.status}
        </Badge>
      </TableCell>
      <TableCell>
        <ItemEtiquetasInline
          itemId={patrimonio.id}
          itemType="patrimonio"
          itemTags={itemTags}
        />
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(patrimonio.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(patrimonio.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
