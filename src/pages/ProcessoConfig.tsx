import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useProcessoConfig, ProcessoConfig as ProcessoConfigType } from "@/hooks/useProcessoConfig";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const configSchema = z.object({
  status_padrao: z.string().optional(),
});

const templateSchema = z.object({
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  local: z.string().optional(),
});

export default function ProcessoConfig() {
  const navigate = useNavigate();
  const { config, isLoading, saveConfig, isSaving } = useProcessoConfig();
  const [templateData, setTemplateData] = useState<any>(null);

  const form = useForm<ProcessoConfigType>({
    resolver: zodResolver(configSchema),
    values: {
      status_padrao: config?.status_padrao || "",
    },
  });

  const templateForm = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      local: "",
    },
  });

  // Watch status selecionado
  const selectedStatus = form.watch('status_padrao') || config?.status_padrao;

  // Carregar template quando status ou config mudar
  useEffect(() => {
    if (selectedStatus && config?.template_oportunidade) {
      try {
        const parsed = JSON.parse(config.template_oportunidade);
        setTemplateData(parsed);
        templateForm.reset(parsed);
      } catch (e) {
        console.error("Erro ao carregar template:", e);
        templateForm.reset({ titulo: "", descricao: "", local: "" });
      }
    } else if (selectedStatus) {
      templateForm.reset({ titulo: "", descricao: "", local: "" });
    }
  }, [selectedStatus, config?.template_oportunidade]);
  
  const onSubmitConfig = (data: ProcessoConfigType) => {
    saveConfig({
      id: config?.id,
      status_padrao: data.status_padrao || null,
      template_oportunidade: config?.template_oportunidade || null,
    });
  };

  const onSubmitTemplate = (data: any) => {
    const templateJson = JSON.stringify(data);
    saveConfig({
      id: config?.id,
      status_padrao: selectedStatus || null,
      template_oportunidade: templateJson,
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/processos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações de Processos</h1>
            <p className="text-muted-foreground">
              Defina os valores padrão para agilizar a criação de novos processos.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Valores Padrão</CardTitle>
            <CardDescription>
              Defina o status padrão para novos processos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitConfig)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="status_padrao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Padrão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="suspenso">Suspenso</SelectItem>
                          <SelectItem value="arquivado">Arquivado</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Status
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {selectedStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Template para processos "{selectedStatus}"</CardTitle>
              <CardDescription>
                Preencha os dados que serão usados como modelo ao criar novos processos com status "{selectedStatus}".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(onSubmitTemplate)} className="space-y-6">
                  
                  <FormField
                    control={templateForm.control}
                    name="titulo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex.: Caso João Silva - Ação Trabalhista"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <ReactQuill
                            theme="snow"
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Breve descrição do caso"
                            className="bg-background"
                            modules={{
                              toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                [{ 'align': [] }],
                                ['link'],
                                ['clean']
                              ]
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={templateForm.control}
                    name="local"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local (Link para documentos)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="https://drive.google.com/..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Template
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
