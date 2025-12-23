import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useContatos } from '@/hooks/useContatos';
import { AgendaParte } from '@/hooks/useAgendaV2';
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PartesSelectorProps {
  partes: Omit<AgendaParte, 'id'>[];
  onChange: (partes: Omit<AgendaParte, 'id'>[]) => void;
  disabled?: boolean;
}

export function PartesSelector({ partes, onChange, disabled }: PartesSelectorProps) {
  const { contacts, loading } = useContatos();
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [selectedPapel, setSelectedPapel] = useState<AgendaParte['papel']>('ENVOLVIDO');
  const [open, setOpen] = useState(false);

  const handleAddParte = () => {
    if (!selectedContact) return;

    const novasPartes = [
      ...partes,
      {
        agenda_id: '',
        contato_id: selectedContact,
        papel: selectedPapel,
        tenant_id: '',
      }
    ];
    
    onChange(novasPartes);
    setSelectedContact('');
    setSelectedPapel('ENVOLVIDO');
    setOpen(false);
  };

  const handleRemoveParte = (index: number) => {
    const novasPartes = partes.filter((_, i) => i !== index);
    onChange(novasPartes);
  };

  const getContatoNome = (contato_id: string) => {
    const contato = contacts.find(c => c.id === contato_id);
    return contato?.nome_fantasia || 'Contato não encontrado';
  };

  const getPapelLabel = (papel: AgendaParte['papel']) => {
    switch (papel) {
      case 'SOLICITANTE':
        return 'Solicitante';
      case 'RESPONSAVEL':
        return 'Responsável';
      case 'ENVOLVIDO':
        return 'Envolvido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Carregando contatos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulário de Adição Rápida */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="flex-1 justify-between"
                  disabled={disabled}
                >
                  {selectedContact
                    ? getContatoNome(selectedContact)
                    : "Selecione um contato..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar contato..." />
                  <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    {contacts.map((contato) => (
                      <CommandItem
                        key={contato.id}
                        value={contato.nome_fantasia}
                        onSelect={() => {
                          setSelectedContact(contato.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedContact === contato.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{contato.nome_fantasia}</span>
                          {contato.email && (
                            <span className="text-xs text-muted-foreground">
                              {contato.email}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <Select
              value={selectedPapel}
              onValueChange={(value) => setSelectedPapel(value as AgendaParte['papel'])}
              disabled={disabled}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITANTE">Solicitante</SelectItem>
                <SelectItem value="RESPONSAVEL">Responsável</SelectItem>
                <SelectItem value="ENVOLVIDO">Envolvido</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={handleAddParte}
              disabled={disabled || !selectedContact}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Parte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Visualização */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Contato</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhuma parte adicionada. Use o formulário acima para adicionar participantes.
                  </TableCell>
                </TableRow>
              ) : (
                partes.map((parte, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{getContatoNome(parte.contato_id)}</span>
                        {contacts.find(c => c.id === parte.contato_id)?.email && (
                          <span className="text-xs text-muted-foreground">
                            {contacts.find(c => c.id === parte.contato_id)?.email}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getPapelLabel(parte.papel)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParte(index)}
                        disabled={disabled}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}