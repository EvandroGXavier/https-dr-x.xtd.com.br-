import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ContatoComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function ContatoCombobox({ value, onValueChange, placeholder = "Selecione um contato..." }: ContatoComboboxProps) {
  const [open, setOpen] = useState(false);
  const [contatos, setContatos] = useState<Array<{ id: string; nome: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchContatos = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.empresa_id) return;

        let query = supabase
          .from("contatos_v2")
          .select("id, nome_fantasia")
          .eq("tenant_id", profile.empresa_id)
          .order("nome_fantasia");

        if (searchTerm) {
          query = query.ilike("nome_fantasia", `%${searchTerm}%`);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        
        setContatos(
          data?.map((c) => ({
            id: c.id,
            nome: c.nome_fantasia || "Sem nome",
          })) || []
        );
      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContatos();
  }, [user, searchTerm]);

  const selectedContato = contatos.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedContato ? selectedContato.nome : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder="Buscar contato..." 
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum contato encontrado."}
          </CommandEmpty>
          <CommandGroup className="max-h-[200px] overflow-auto">
            {contatos.map((contato) => (
              <CommandItem
                key={contato.id}
                value={contato.id}
                onSelect={(currentValue) => {
                  onValueChange(currentValue === value ? "" : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === contato.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {contato.nome}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
