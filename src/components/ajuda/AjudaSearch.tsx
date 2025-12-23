import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, HelpCircle } from 'lucide-react';

interface AjudaSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export const AjudaSearch = ({ 
  searchTerm, 
  onSearchChange, 
  placeholder = "Buscar na ajuda..." 
}: AjudaSearchProps) => {
  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button variant="outline" size="icon" className="flex-shrink-0">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-muted-foreground">
          Pressione <kbd className="px-1 py-0.5 bg-muted rounded text-xs">ESC</kbd> para limpar
        </div>
      )}
    </div>
  );
};