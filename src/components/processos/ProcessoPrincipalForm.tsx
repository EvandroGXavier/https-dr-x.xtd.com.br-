import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Scale } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";

interface ProcessoPrincipalFormProps {
  processo: any;
  control: any;
  isEditing: boolean;
  form: UseFormReturn<any>;
  initialData?: any;
}

const tipoLabels = {
  civel: "Cível",
  criminal: "Criminal",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  outros: "Outros"
};

const instanciaLabels = {
  primeira: "Primeira Instância",
  segunda: "Segunda Instância", 
  superior: "Superior",
  supremo: "Supremo"
};

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "suspenso", label: "Suspenso" },
  { value: "arquivado", label: "Arquivado" },
  { value: "finalizado", label: "Finalizado" }
];

export function ProcessoPrincipalForm({ processo, control, isEditing, form, initialData }: ProcessoPrincipalFormProps) {
  // Atualiza o formulário quando os dados iniciais mudam (carregamento assíncrono)
  useEffect(() => {
    if (initialData && form) {
      console.log('🔄 Resetando form com initialData:', initialData);
      form.reset({
        titulo: initialData.titulo || "",
        descricao: initialData.descricao || "",
        local: initialData.local || "",
        status: initialData.status || "ativo",
        // Adicione outros campos aqui conforme necessário
      });
    }
  }, [initialData, form]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Informações do Processo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                control={control}
                name="numero_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} className="font-mono" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="assunto_principal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assunto Principal</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Processo</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(tipoLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {tipoLabels[field.value as keyof typeof tipoLabels]}
                          </Badge>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="space-y-4">
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Atual</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={
                            field.value === "ativo" ? "bg-success/10 text-success" :
                            field.value === "suspenso" ? "bg-warning/10 text-warning" :
                            field.value === "arquivado" ? "bg-muted-foreground/10 text-muted-foreground" :
                            "bg-primary/10 text-primary"
                          }>
                            {field.value}
                          </Badge>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="valor_causa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Causa</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          disabled={!isEditing}
                        />
                      ) : (
                        field.value && (
                          <p className="text-lg font-semibold py-2">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(field.value)}
                          </p>
                        )
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="data_distribuicao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Distribuição</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: ptBR })
                              ) : (
                                "Selecione uma data"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={field.onChange}
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                      ) : (
                        field.value && (
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="text-base">
                              {new Date(field.value).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isEditing && processo.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado</label>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(processo.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field} 
                    disabled={!isEditing}
                    rows={6}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
