import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  FileText,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BibliotecaModelo } from '@/hooks/useBiblioteca';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ModeloListItemProps {
  modelo: BibliotecaModelo;
  onDuplicate: (modelo: BibliotecaModelo) => void;
  onDelete: (modelo: BibliotecaModelo) => void;
}

export const ModeloListItem: React.FC<ModeloListItemProps> = ({
  modelo,
  onDuplicate,
  onDelete
}) => {
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    navigate(`/biblioteca/modelos/${modelo.id}`);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/biblioteca/modelos/${modelo.id}?view=true`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/biblioteca/modelos/${modelo.id}`);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(modelo);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(modelo);
  };

  return (
    <Card 
      className="group hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
      onDoubleClick={handleDoubleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {modelo.titulo}
              </h3>
              {!modelo.publicado && (
                <Badge variant="secondary" className="text-xs">
                  Rascunho
                </Badge>
              )}
            </div>
            
            {modelo.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {modelo.descricao}
              </p>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              {modelo.biblioteca_grupos && (
                <Badge variant="outline" className="text-xs">
                  {modelo.biblioteca_grupos.nome}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {modelo.formato.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(modelo.updated_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Dica:</span> Clique duas vezes para editar
          </p>
        </div>
      </CardContent>
    </Card>
  );
};