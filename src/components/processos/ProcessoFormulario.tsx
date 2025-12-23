import { useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useProcessoConfig } from "@/hooks/useProcessoConfig";
import { useProcessos } from "@/hooks/useProcessos";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

// [DR.X-EPR] Schema V2 limpo - removido advogado_responsavel_id
const schema = z.object({
  titulo: z.string().min(3, "Informe o título do caso."),
  descricao: z.string().optional().nullable(),
  local: z.string().url("Link deve ser uma URL válida").optional().or(z.literal('')).nullable(),
  status: z.string().optional(),
});

export type ProcessoFormValues = z.infer<typeof schema>;

type Props = {
  mode: "create" | "edit";
  initialData?: Partial<ProcessoFormValues> & { id?: string };
  onSubmitOk?: (id?: string) => void;
  onCancel?: () => void;
};

export default function ProcessoFormulario({ mode, initialData, onSubmitOk, onCancel }: Props) {
  const { toast } = useToast();
  const { createProcesso, updateProcesso, isCreating, isUpdating } = useProcessos();
  const { config: processoConfig, isLoading: isLoadingConfig } = useProcessoConfig();

  const loading = isCreating || isUpdating || isLoadingConfig;

  const form = useForm<ProcessoFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      titulo: "",
      descricao: "",
      local: "",
      status: "ativo"
    }
  });

  useEffect(() => {
    if (mode === 'create' && !isLoadingConfig && processoConfig) {
      let templateData: Partial<ProcessoFormValues> = {};
      if (processoConfig.template_oportunidade) {
        try {
          const parsed = JSON.parse(processoConfig.template_oportunidade);
          templateData = {
            titulo: parsed.titulo,
            descricao: parsed.descricao,
            local: parsed.local,
          };
        } catch (e) {
          console.error("Erro template:", e);
        }
      }
      form.reset({
        titulo: initialData?.titulo ?? templateData.titulo ?? "",
        descricao: initialData?.descricao ?? templateData.descricao ?? "",
        local: initialData?.local ?? templateData.local ?? "",
        status: initialData?.status ?? processoConfig.status_padrao ?? "ativo",
      });
    } else if (mode === 'edit' && initialData) {
      form.reset({
        titulo: initialData.titulo || "",
        descricao: initialData.descricao || "",
        local: initialData.local || "",
        status: initialData.status || "ativo",
      });
    }
  }, [mode, initialData, processoConfig, isLoadingConfig, form]);

  const onSubmit = async (values: ProcessoFormValues) => {
    try {
      let result;
      // [DR.X-EPR] Payload limpo: apenas dados da tabela 'processos'
      const payload = {
        titulo: values.titulo,
        descricao: values.descricao || null,
        local: values.local === '' ? null : values.local,
        status: values.status || "ativo",
      };

      if (mode === "create") {
        result = await createProcesso(payload as any);
        toast({ title: "Sucesso", description: "Pasta do caso criada." });
      } else {
        if (!initialData?.id) throw new Error("ID ausente para edição.");
        
        // Update seguro via Hook
        result = await updateProcesso({
          id: initialData.id,
          ...payload
        });
        toast({ title: "Salvo", description: "Dados atualizados com sucesso." });
      }

      if (onSubmitOk) onSubmitOk(result?.id || initialData?.id);

    } catch (e: any) {
      console.error("Erro onSubmit:", e);
      toast({ 
        title: "Erro", 
        description: e?.message || "Falha ao processar.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Título do Caso / Parte <span className="text-destructive">*</span>
          </label>
          <Input 
            {...form.register("titulo")} 
            placeholder="Ex.: Caso João Silva vs Empresa X"
            disabled={loading}
            className="text-lg font-medium"
          />
          {form.formState.errors.titulo && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.titulo.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descrição / Resumo</label>
          <div className="prose-sm max-w-none">
            <Controller
              name="descricao"
              control={form.control}
              render={({ field }) => (
                <ReactQuill
                  theme="snow"
                  value={field.value || ""}
                  onChange={field.onChange}
                  readOnly={loading}
                  placeholder="Detalhes iniciais..."
                  className="bg-background"
                  modules={{
                    toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['clean']]
                  }}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pasta na Nuvem (Link)</label>
            <Input 
              {...form.register("local")} 
              placeholder="https://drive.google.com/..."
              disabled={loading}
            />
            {form.formState.errors.local && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.local.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status Inicial</label>
            <Input 
              {...form.register("status")} 
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Criar Caso" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
