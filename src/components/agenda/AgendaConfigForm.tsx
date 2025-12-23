import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AgendaConfig } from '@/hooks/useAgendaConfig';

const formSchema = z.object({
  nome_fluxo: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  tipo: z.string().min(1, 'Selecione um tipo'),
  modulo_origem: z.string().min(1, 'Selecione um módulo'),
  responsavel_padrao: z.string().optional(),
  prazo_padrao_minutos: z.coerce
    .number()
    .min(1, 'Prazo deve ser maior que 0')
    .default(30),
  participantes_padrao: z.string().optional(),
  descricao_padrao: z.string().optional(),
  gatilho: z.string().min(1, 'Selecione um gatilho'),
  ativo: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AgendaConfigFormProps {
  config?: AgendaConfig;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AgendaConfigForm({
  config,
  onSubmit,
  onCancel,
  isLoading,
}: AgendaConfigFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_fluxo: config?.nome_fluxo || '',
      tipo: config?.tipo || '',
      modulo_origem: config?.modulo_origem || 'Processos',
      responsavel_padrao: config?.responsavel_padrao || 'advogado_logado',
      prazo_padrao_minutos: config?.prazo_padrao_minutos || 30,
      participantes_padrao: config?.participantes_padrao
        ? JSON.stringify(config.participantes_padrao, null, 2)
        : '[]',
      descricao_padrao: config?.descricao_padrao || '',
      gatilho: config?.gatilho || 'on_create',
      ativo: config?.ativo ?? true,
    },
  });

  const handleSubmit = (values: FormValues) => {
    try {
      const participantes = values.participantes_padrao
        ? JSON.parse(values.participantes_padrao)
        : [];

      onSubmit({
        ...values,
        participantes_padrao: participantes,
      });
    } catch (error) {
      form.setError('participantes_padrao', {
        message: 'JSON inválido para participantes',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome_fluxo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Fluxo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Briefing - Atendimento Inicial" {...field} />
              </FormControl>
              <FormDescription>
                Nome descritivo para este fluxo de agenda automática
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Atendimento">Atendimento</SelectItem>
                    <SelectItem value="Audiência">Audiência</SelectItem>
                    <SelectItem value="Interna">Interna</SelectItem>
                    <SelectItem value="Prazo">Prazo</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modulo_origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Módulo de Origem</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o módulo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Processos">Processos</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Contatos">Contatos</SelectItem>
                    <SelectItem value="Contratos">Contratos</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gatilho"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gatilho</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Quando disparar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="on_create">Ao Criar</SelectItem>
                    <SelectItem value="on_approve">Ao Aprovar</SelectItem>
                    <SelectItem value="on_approve_fees">
                      Ao Aprovar Honorários
                    </SelectItem>
                    <SelectItem value="on_sign">Ao Assinar</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prazo_padrao_minutos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo Padrão (minutos)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>
                  Tempo padrão para conclusão (em minutos)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="responsavel_padrao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável Padrão</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Quem será responsável" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="advogado_logado">Advogado Logado</SelectItem>
                  <SelectItem value="responsavel_cliente">
                    Responsável do Cliente
                  </SelectItem>
                  <SelectItem value="equipe_atendimento">
                    Equipe de Atendimento
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="participantes_padrao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Participantes Padrão (JSON)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='[{"papel":"cliente_principal"}]'
                  className="font-mono text-sm"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Lista de participantes em formato JSON
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao_padrao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Padrão</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição que aparecerá na agenda criada automaticamente..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ativo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Ativo</FormLabel>
                <FormDescription>
                  Ativar/desativar este fluxo de agenda automática
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : config ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
