import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { AgendaV2 } from '@/hooks/useAgendaV2';
import { Clock } from 'lucide-react';

const agendaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  data_inicio: z.date({ required_error: 'Data de início é obrigatória' }),
  data_fim: z.date().optional(),
  status: z.enum(['analise', 'a_fazer', 'fazendo', 'feito']),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).optional(),
  observacoes: z.string().optional(),
});

type AgendaFormData = z.infer<typeof agendaSchema>;

interface AgendaTabProps {
  agenda: Partial<AgendaV2>;
  onChange: (agendaData: Partial<AgendaV2>) => void;
}

export function AgendaTab({ agenda, onChange }: AgendaTabProps) {
  const {
    register,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<AgendaFormData>({
    resolver: zodResolver(agendaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      status: 'analise',
      prioridade: 'media',
      observacoes: '',
    }
  });

  // Sincronizar formulário com props
  useEffect(() => {
    if (agenda && Object.keys(agenda).length > 0) {
      reset({
        titulo: agenda.titulo || '',
        descricao: agenda.descricao || '',
        data_inicio: agenda.data_inicio ? new Date(agenda.data_inicio) : new Date(),
        data_fim: agenda.data_fim ? new Date(agenda.data_fim) : undefined,
        status: agenda.status || 'analise',
        prioridade: (agenda.prioridade as any) || 'media',
        observacoes: agenda.observacoes || '',
      });
    }
  }, [agenda, reset]);

  // Propagar mudanças para o componente pai
  useEffect(() => {
    const subscription = watch((formData) => {
      if (formData.data_inicio) {
        onChange({
          titulo: formData.titulo || '',
          descricao: formData.descricao,
          data_inicio: formData.data_inicio.toISOString(),
          data_fim: formData.data_fim?.toISOString(),
          status: formData.status,
          prioridade: formData.prioridade,
          observacoes: formData.observacoes,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Dados da Agenda
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Digite o título da agenda..."
            />
            {errors.titulo && (
              <p className="text-sm text-destructive">{errors.titulo.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição detalhada da agenda..."
              rows={4}
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data/Hora de Início *</Label>
              <DateTimePicker
                value={watch('data_inicio')}
                onChange={(date) => setValue('data_inicio', date as Date)}
                placeholder="Selecione data e hora de início"
              />
              {errors.data_inicio && (
                <p className="text-sm text-destructive">{errors.data_inicio.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data/Hora de Fim</Label>
              <DateTimePicker
                value={watch('data_fim')}
                onChange={(date) => setValue('data_fim', date)}
                placeholder="Selecione data e hora de fim (opcional)"
              />
            </div>
          </div>

          {/* Status e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analise">Em Análise</SelectItem>
                  <SelectItem value="a_fazer">A Fazer</SelectItem>
                  <SelectItem value="fazendo">Em Andamento</SelectItem>
                  <SelectItem value="feito">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={watch('prioridade')}
                onValueChange={(value) => setValue('prioridade', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              {...register('observacoes')}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
