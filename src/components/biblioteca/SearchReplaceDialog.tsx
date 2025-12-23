// src/components/biblioteca/SearchReplaceDialog.tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Replace, ReplaceAll } from "lucide-react";
import { toast } from "sonner";
import { Editor } from "@tiptap/react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  initialSearchText?: string;
};

export default function SearchReplaceDialog({ open, onOpenChange, editor, initialSearchText }: Props) {
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Preencher campo de busca com texto selecionado quando o diálogo abrir
  useEffect(() => {
    if (open && initialSearchText) {
      setSearchText(initialSearchText);
    }
  }, [open, initialSearchText]);

  const findMatches = (text: string): Array<{ from: number; to: number }> => {
    if (!editor || !text) return [];

    const content = editor.state.doc.textContent;
    const matches: Array<{ from: number; to: number }> = [];

    try {
      if (useRegex) {
        const flags = caseSensitive ? "g" : "gi";
        const regex = new RegExp(text, flags);
        let match;

        while ((match = regex.exec(content)) !== null) {
          matches.push({
            from: match.index,
            to: match.index + match[0].length,
          });
        }
      } else {
        const searchTerm = caseSensitive ? text : text.toLowerCase();
        const contentToSearch = caseSensitive ? content : content.toLowerCase();
        let startIndex = 0;

        while (true) {
          const index = contentToSearch.indexOf(searchTerm, startIndex);
          if (index === -1) break;

          matches.push({
            from: index,
            to: index + text.length,
          });
          startIndex = index + 1;
        }
      }
    } catch (error) {
      toast.error("Erro na expressão regular");
      return [];
    }

    return matches;
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      toast.error("Digite um texto para buscar");
      return;
    }

    const matches = findMatches(searchText);
    setTotalMatches(matches.length);

    if (matches.length === 0) {
      toast.info("Nenhuma correspondência encontrada");
      setCurrentIndex(0);
      return;
    }

    // Ir para a primeira correspondência
    const firstMatch = matches[0];
    editor?.commands.setTextSelection({ from: firstMatch.from, to: firstMatch.to });
    editor?.commands.focus();
    setCurrentIndex(0);
    toast.success(`${matches.length} correspondência(s) encontrada(s)`);
  };

  const handleNext = () => {
    const matches = findMatches(searchText);
    if (matches.length === 0) {
      toast.info("Nenhuma correspondência encontrada");
      return;
    }

    const nextIndex = (currentIndex + 1) % matches.length;
    const match = matches[nextIndex];
    editor?.commands.setTextSelection({ from: match.from, to: match.to });
    editor?.commands.focus();
    setCurrentIndex(nextIndex);
  };

  const handleReplace = () => {
    if (!searchText.trim()) {
      toast.error("Digite um texto para buscar");
      return;
    }

    const matches = findMatches(searchText);
    if (matches.length === 0) {
      toast.info("Nenhuma correspondência encontrada");
      return;
    }

    const match = matches[currentIndex] || matches[0];
    
    // Substituir o texto atual
    editor?.chain()
      .focus()
      .setTextSelection({ from: match.from, to: match.to })
      .insertContent(replaceText)
      .run();

    toast.success("Texto substituído");

    // Buscar próxima ocorrência
    setTimeout(() => {
      const newMatches = findMatches(searchText);
      if (newMatches.length > 0) {
        const nextMatch = newMatches[Math.min(currentIndex, newMatches.length - 1)];
        editor?.commands.setTextSelection({ from: nextMatch.from, to: nextMatch.to });
      }
      setTotalMatches(newMatches.length);
    }, 100);
  };

  const handleReplaceAll = () => {
    if (!searchText.trim()) {
      toast.error("Digite um texto para buscar");
      return;
    }

    const matches = findMatches(searchText);
    if (matches.length === 0) {
      toast.info("Nenhuma correspondência encontrada");
      return;
    }

    // Substituir de trás para frente para manter as posições corretas
    const reversedMatches = [...matches].reverse();
    
    editor?.chain().focus();
    
    reversedMatches.forEach((match) => {
      editor?.chain()
        .setTextSelection({ from: match.from, to: match.to })
        .insertContent(replaceText)
        .run();
    });

    toast.success(`${matches.length} substituição(ões) realizada(s)`);
    setTotalMatches(0);
    setCurrentIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        handleReplaceAll();
      } else {
        handleNext();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Buscar e Substituir</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Texto a buscar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="replace">Substituir por</Label>
            <Input
              id="replace"
              placeholder="Texto para substituir..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked === true)}
              />
              <Label htmlFor="case-sensitive" className="text-sm font-normal cursor-pointer">
                Case-sensitive
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="regex"
                checked={useRegex}
                onCheckedChange={(checked) => setUseRegex(checked === true)}
              />
              <Label htmlFor="regex" className="text-sm font-normal cursor-pointer">
                Usar Regex
              </Label>
            </div>
          </div>

          {totalMatches > 0 && (
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} de {totalMatches} correspondências
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSearch}
            className="w-full sm:w-auto"
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={totalMatches === 0}
            className="w-full sm:w-auto"
          >
            Próximo
          </Button>
          <Button
            variant="outline"
            onClick={handleReplace}
            disabled={totalMatches === 0}
            className="w-full sm:w-auto"
          >
            <Replace className="h-4 w-4 mr-2" />
            Substituir
          </Button>
          <Button
            onClick={handleReplaceAll}
            disabled={totalMatches === 0}
            className="w-full sm:w-auto"
          >
            <ReplaceAll className="h-4 w-4 mr-2" />
            Substituir Todos
          </Button>
        </DialogFooter>

        <div className="text-xs text-muted-foreground mt-2">
          <p>Atalhos: Enter = Próximo | Ctrl+Enter = Substituir Todos</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
