import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProcessos } from "@/hooks/useProcessos";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale } from "lucide-react";

// Schema de validação robusto
const formSchema = z.object({
  titulo: z.string().min(3, "O título é obrigatório (mínimo 3 caracteres)"),
  descricao: z.string().optional().nullable(),
  local: z.string().optional().nullable(),
  status: z.string().default('ativo'),
});

type FormValues = z.infer<typeof formSchema>;

interface ProcessoPrincipalFormStandaloneProps {
  initialData?: any;
  onSuccess?: () => void;
  processoId?: string;
}

export function ProcessoPrincipalFormStandalone({
  initialData,
  onSuccess,
  processoId,
}: ProcessoPrincipalFormStandaloneProps) {
  const { createProcesso, updateProcesso, isCreating, isUpdating } = useProcessos();
  const isEditing = !!processoId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      local: "",
      status: "ativo",
      ...initialData,
    },
  });

  // Resetar formulário se initialData mudar
  useEffect(() => {
    if (initialData) {
      console.log('🔄 Atualizando form com initialData:', initialData);
      form.reset({
        titulo: initialData.titulo || "",
        descricao: initialData.descricao || "",
        local: initialData.local || "",
        status: initialData.status || "ativo",
      });
    }
  }, [initialData, form]);

  const onSubmit = async (values: FormValues) => {
    console.log("📤 Submetendo formulário:", values);
    try {
      if (isEditing && processoId) {
        // Modo de edição - updateProcesso espera { id, ...data }
        console.log('✏️ Modo edição - Processo ID:', processoId);
        await updateProcesso({ id: processoId, ...values });
      } else {
        // Modo de criação - createProcesso agora aceita Partial<Processo>
        console.log('➕ Modo criação');
        await createProcesso(values);
        form.reset(); // Limpa apenas se for criação
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      // O toast já é exibido pelo hook, apenas logamos aqui
      console.error("❌ Erro no formulário:", error);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          {isEditing ? "Editar Processo" : "Novo Processo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Caso *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Ação Trabalhista - João Silva"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição / Narrativa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes iniciais do caso..."
                      rows={6}
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local / Comarca</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: 1ª Vara Cível de São Paulo"
                      {...field}
                      value={field.value || ""}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? "Salvar Alterações" : "Criar Processo"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
