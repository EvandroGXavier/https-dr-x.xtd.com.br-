import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePatrimonios } from "@/hooks/usePatrimonios";
import { PatrimonioDataTable } from "./patrimonio/PatrimonioDataTable";
import { PatrimonioDialog } from "./patrimonio/PatrimonioDialog";
import { TagFilter } from "@/components/etiquetas/TagFilter";
import { Search } from "lucide-react";

interface PatrimonioTabProps {
  contatoId: string;
}

export const PatrimonioTab = ({ contatoId }: PatrimonioTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [comTags, setComTags] = useState<string[]>([]);
  const [semTags, setSemTags] = useState<string[]>([]);
  
  const { patrimonios, isLoading } = usePatrimonios(contatoId);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  // Filtros aplicados
  const filteredPatrimonios = useMemo(() => {
    return patrimonios.filter(patrimonio => {
      // Filtro de busca
      const searchLower = searchTerm.toLowerCase().trim();
      if (searchLower) {
        const matchesSearch = 
          patrimonio.descricao?.toLowerCase().includes(searchLower) ||
          patrimonio.natureza?.toLowerCase().includes(searchLower) ||
          patrimonio.status?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por etiquetas será aplicado no componente DataTable
      return true;
    });
  }, [patrimonios, searchTerm]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Patrimônio</CardTitle>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Bem
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, natureza, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <TagFilter
            comTags={comTags}
            semTags={semTags}
            onComTagsChange={setComTags}
            onSemTagsChange={setSemTags}
            ownerType="contatos"
          />
        </div>

        <PatrimonioDataTable
          patrimonios={filteredPatrimonios}
          isLoading={isLoading}
          onEdit={handleEdit}
          comTags={comTags}
          semTags={semTags}
        />
      </CardContent>

      <PatrimonioDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        contatoId={contatoId}
        patrimonioId={editingId}
      />
    </Card>
  );
};
