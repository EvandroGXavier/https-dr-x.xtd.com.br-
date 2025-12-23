import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useProcessoPartes } from "@/hooks/useProcessoPartes";
import { type QualificacaoParte } from "@/hooks/useProcessos";
import { useContatos } from "@/hooks/useContatos";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProcessoPartesProps {
  processoId: string;
}

// QUALIFICAÇÃO: Como a parte atua NO PROCESSO (valores válidos do enum qualificacao_parte)
const qualificacaoOptions = [
  { value: "autor", label: "Autor" },
  { value: "reu", label: "Réu" },
  { value: "advogado", label: "Advogado" },
  { value: "cliente", label: "Cliente" },
  { value: "contrario", label: "Contrário" },
  { value: "testemunha", label: "Testemunha" },
  { value: "juizo", label: "Juízo" },
  { value: "ministerio_publico", label: "Ministério Público" },
  { value: "terceiro_interessado", label: "Terceiro Interessado" },
  { value: "perito", label: "Perito" },
  { value: "falecido", label: "Falecido" },
  { value: "outros", label: "Outros" },
];

// TIPO: Tipo de participação no escritório
const tipoParteOptions = [
  { value: "cliente", label: "Cliente" },
  { value: "adverso", label: "Adverso" },
  { value: "terceiro", label: "Terceiro" },
  { value: "testemunha", label: "Testemunha" },
  { value: "perito", label: "Perito" },
  { value: "outro", label: "Outro" },
];

export function ProcessoPartes({ processoId }: ProcessoPartesProps) {
  const navigate = useNavigate();
  const { partes, isLoading, addParte, removeParte, updateParte, isAdding, isRemoving } = useProcessoPartes(processoId);
  const { contacts } = useContatos();

  const [selectedContatoId, setSelectedContatoId] = useState<string>("");
  const [updatingParteId, setUpdatingParteId] = useState<string | null>(null);

  const handleAddParte = async () => {
    if (!selectedContatoId) {
      toast.error("Selecione um contato");
      return;
    }

    try {
      await addParte({
        processo_id: processoId,
        contato_id: selectedContatoId,
        qualificacao: "autor",
        principal: false,
        observacoes: "",
      });
      setSelectedContatoId("");
      toast.success("Parte adicionada! Edite o Tipo e Qualificação na tabela.");
    } catch (error) {
      console.error("Erro ao adicionar parte:", error);
    }
  };

  const handleRemoveParte = async (parteId: string) => {
    if (window.confirm("Confirma a remoção desta parte?")) {
      try {
        await removeParte(parteId);
      } catch (error) {
        console.error("Erro ao remover parte:", error);
      }
    }
  };

  const handleUpdateQualificacao = async (parteId: string, novaQualificacao: QualificacaoParte) => {
    setUpdatingParteId(parteId);
    try {
      await updateParte(parteId, { qualificacao: novaQualificacao });
      toast.success("Qualificação atualizada");
    } catch (error) {
      console.error("Erro ao atualizar qualificação:", error);
      toast.error("Erro ao atualizar qualificação");
    } finally {
      setUpdatingParteId(null);
    }
  };

  const handleUpdateTipo = async (parteId: string, novoTipo: string) => {
    setUpdatingParteId(parteId);
    try {
      await updateParte(parteId, { tipo: novoTipo });
      toast.success("Tipo atualizado");
    } catch (error) {
      console.error("Erro ao atualizar tipo:", error);
      toast.error("Erro ao atualizar tipo");
    } finally {
      setUpdatingParteId(null);
    }
  };

  const handleDoubleClickNome = (contatoId: string) => {
    // Navegar para edição do contato com retorno contextual para a aba de partes
    navigate(`/contatos/${contatoId}/editar?returnTo=/processos/${processoId}&parentType=processo&parentId=${processoId}`);
  };

  // Contatos disponíveis (não vinculados)
  const availableContacts = contacts.filter(
    (contact) => !partes.some((parte: any) => parte.contato_id === contact.id)
  );

  const getLabel = (options: { value: string; label: string }[], value: string | null | undefined) => {
    if (!value) return "-";
    return options.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <div className="space-y-4">
      {/* Formulário Simplificado - Apenas Seleção de Contato */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Inserir Partes no Processo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="contato">Nome Pessoa</Label>
              <Select value={selectedContatoId} onValueChange={setSelectedContatoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contato..." />
                </SelectTrigger>
                <SelectContent>
                  {availableContacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddParte}
              disabled={!selectedContatoId || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Partes com Edição Inline */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              Carregando partes...
            </div>
          ) : partes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma parte vinculada ao processo
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[200px]">Qualificação</TableHead>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="text-right w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partes.map((parte: any) => {
                  const isUpdatingThis = updatingParteId === parte.id;

                  return (
                    <TableRow key={parte.id}>
                      {/* NOME - Com double-click para editar contato */}
                      <TableCell
                        onDoubleClick={() => parte.contatos_v2?.id && handleDoubleClickNome(parte.contatos_v2.id)}
                        className="cursor-pointer hover:bg-muted/50"
                        title="Clique duplo para editar o contato"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {parte.contatos_v2?.nome_fantasia || "Nome não disponível"}
                          </div>
                          {parte.contatos_v2?.cpf_cnpj && (
                            <div className="text-sm text-muted-foreground">
                              CPF/CNPJ: {parte.contatos_v2.cpf_cnpj}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* QUALIFICAÇÃO - Inline Editable */}
                      <TableCell>
                        <Select
                          value={parte.qualificacao || ""}
                          onValueChange={(value) => handleUpdateQualificacao(parte.id, value as QualificacaoParte)}
                          disabled={isUpdatingThis}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {qualificacaoOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* TIPO - Inline Editable */}
                      <TableCell>
                        <Select
                          value={parte.tipo || ""}
                          onValueChange={(value) => handleUpdateTipo(parte.id, value)}
                          disabled={isUpdatingThis}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tipoParteOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParte(parte.id)}
                          disabled={isRemoving || isUpdatingThis}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}