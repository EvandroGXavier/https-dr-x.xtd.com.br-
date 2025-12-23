import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFaseTemplates, FaseTemplate } from "@/hooks/useFaseTemplates";
import { useEtiquetas } from "@/hooks/useEtiquetas";

const templateSchema = z.object({
  etiqueta_fase_id: z.string().min(1, "Selecione uma etiqueta de fase"),
  tarefa_descricao: z.string().min(3, "A tarefa deve ter pelo menos 3 caracteres"),
  alerta_dias: z.coerce.number().min(0, "Dias deve ser positivo ou zero").nullable(),
  etiqueta_auto_id: z.string().nullable(),
});

interface FaseTemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  template: FaseTemplate | null;
}

export function FaseTemplateDrawer({ open, onClose, template }: FaseTemplateDrawerProps) {
  const { createTemplate, updateTemplate } = useFaseTemplates();
  const { etiquetas: todasEtiquetas } = useEtiquetas("processos");

  // Filtrar apenas etiquetas do tipo "fase" e etiquetas informativas
  const etiquetasFase = todasEtiquetas.filter((e) => 
    e.id && (e.grupo === "fase" || (e as any).tipo === "fase")
  );
  const etiquetasInformativas = todasEtiquetas.filter((e) => 
    e.id && (e.grupo === "informativa" || (e as any).tipo === "informativa" || !e.grupo)
  );

  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      etiqueta_fase_id: "",
      tarefa_descricao: "",
      alerta_dias: null,
      etiqueta_auto_id: null,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        etiqueta_fase_id: template.etiqueta_fase_id,
        tarefa_descricao: template.tarefa_descricao,
        alerta_dias: template.alerta_dias,
        etiqueta_auto_id: template.etiqueta_auto_id,
      });
    } else {
      form.reset({
        etiqueta_fase_id: "",
        tarefa_descricao: "",
        alerta_dias: null,
        etiqueta_auto_id: null,
      });
    }
  }, [template, form]);

  const onSubmit = async (data: any) => {
    try {
      const submitData = {
        ...data,
        etiqueta_auto_id: data.etiqueta_auto_id === "none" ? null : data.etiqueta_auto_id,
      };
      
      if (template?.id) {
        await updateTemplate.mutateAsync({ ...submitData, id: template.id });
      } else {
        await createTemplate.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      console.error("Erro ao salvar template:", error);
    }
  };

  const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>{template ? "Editar" : "Novo"} Template de Fase</SheetTitle>
          <SheetDescription>
            Configure ações automáticas ao mudar a fase de um processo
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="etiqueta_fase_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta de Fase *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fase..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {etiquetasFase.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          Nenhuma etiqueta de fase encontrada
                        </div>
                      ) : (
                        etiquetasFase.map((etiqueta) => (
                          <SelectItem key={etiqueta.id} value={etiqueta.id}>
                            {etiqueta.icone} {etiqueta.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Quando esta fase for aplicada ao processo, as ações abaixo serão executadas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tarefa_descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição da Tarefa *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex: Revisar documentação e entrar em contato com cliente"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Esta tarefa será criada automaticamente na agenda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alerta_dias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo da Tarefa (dias)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Ex: 3"
                    />
                  </FormControl>
                  <FormDescription>
                    Quantos dias a partir de hoje para realizar a tarefa (deixe vazio para sem prazo)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="etiqueta_auto_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etiqueta Adicional (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {etiquetasInformativas.map((etiqueta) => (
                        <SelectItem key={etiqueta.id} value={etiqueta.id}>
                          {etiqueta.icone} {etiqueta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Esta etiqueta será adicionada automaticamente ao processo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {template ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
