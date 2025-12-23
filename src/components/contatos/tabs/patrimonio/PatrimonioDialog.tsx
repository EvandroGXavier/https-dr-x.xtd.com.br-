import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePatrimonios } from "@/hooks/usePatrimonios";
import { PatrimonioFormData } from "@/types/patrimonio";
import { TagSelector } from "@/components/etiquetas/TagSelector";

interface PatrimonioDialogProps {
  open: boolean;
  onClose: () => void;
  contatoId: string;
  patrimonioId?: string | null;
}

export const PatrimonioDialog = ({
  open,
  onClose,
  contatoId,
  patrimonioId,
}: PatrimonioDialogProps) => {
  const { patrimonios, createPatrimonio, updatePatrimonio } = usePatrimonios(contatoId);
  
  const patrimonio = patrimonioId
    ? patrimonios.find((p) => p.id === patrimonioId)
    : null;

  const form = useForm<PatrimonioFormData>({
    defaultValues: {
      descricao: "",
      natureza: "DIREITO",
      status: "ATIVO",
      valor_saldo: undefined,
      data_vinculo: undefined,
      data_desvinculo: undefined,
      detalhes: {},
      observacao: "",
    },
  });

  useEffect(() => {
    if (patrimonio) {
      form.reset({
        descricao: patrimonio.descricao,
        natureza: patrimonio.natureza,
        status: patrimonio.status,
        valor_saldo: patrimonio.valor_saldo || undefined,
        data_vinculo: patrimonio.data_vinculo || undefined,
        data_desvinculo: patrimonio.data_desvinculo || undefined,
        detalhes: patrimonio.detalhes || {},
        observacao: patrimonio.observacao || "",
      });
    } else {
      form.reset({
        descricao: "",
        natureza: "DIREITO",
        status: "ATIVO",
        valor_saldo: undefined,
        data_vinculo: undefined,
        data_desvinculo: undefined,
        detalhes: {},
        observacao: "",
      });
    }
  }, [patrimonio, form]);

  const onSubmit = async (data: PatrimonioFormData) => {
    try {
      if (patrimonioId) {
        await updatePatrimonio({ id: patrimonioId, data });
      } else {
        await createPatrimonio({ ...data, contato_id: contatoId });
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar patrimônio:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {patrimonioId ? "Editar Patrimônio" : "Novo Patrimônio"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Apartamento em São Paulo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="natureza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Natureza *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DIREITO">Direito (Ativo)</SelectItem>
                        <SelectItem value="OBRIGACAO">Obrigação (Passivo)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor_saldo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor/Saldo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="R$ 0,00"
                      value={
                        field.value
                          ? new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(field.value)
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .replace(/(\d)(\d{2})$/, "$1.$2");
                        field.onChange(value ? parseFloat(value) : undefined);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_vinculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vínculo</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_desvinculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Desvínculo</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Observações adicionais sobre o patrimônio"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {patrimonioId && (
              <div>
                <FormLabel>Etiquetas</FormLabel>
                <TagSelector
                  referenciaType="patrimonio"
                  referenciaId={patrimonioId}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {patrimonioId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
