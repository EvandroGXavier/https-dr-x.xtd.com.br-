import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AgendaEtapa } from '@/hooks/useAgendaV2';
import { useContatos } from '@/hooks/useContatos';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  CalendarIcon,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EtapasEditorProps {
  etapas: AgendaEtapa[];
  onChange: (etapas: Omit<AgendaEtapa, 'id'>[]) => void;
  onStatusChange?: (etapaId: string, status: AgendaEtapa['status']) => void;
  disabled?: boolean;
  editMode?: boolean;
}

export function EtapasEditor({ 
  etapas, 
  onChange, 
  onStatusChange, 
  disabled, 
  editMode = true 
}: EtapasEditorProps) {
  const { contacts } = useContatos();
  const [localEtapas, setLocalEtapas] = useState<Omit<AgendaEtapa, 'id'>[]>([]);

  // Sincronizar com props
  useEffect(() => {
    setLocalEtapas(etapas.map(etapa => ({
      agenda_id: etapa.agenda_id,
      ordem: etapa.ordem,
      titulo: etapa.titulo,
      descricao: etapa.descricao,
      prevista_para: etapa.prevista_para,
      status: etapa.status,
      responsavel_contato_id: etapa.responsavel_contato_id,
    })));
  }, [etapas]);

  // Notificar mudanças apenas no modo de edição
  useEffect(() => {
    if (editMode) {
      onChange(localEtapas);
    }
  }, [localEtapas, onChange, editMode]);

  const addEtapa = () => {
    const newOrdem = Math.max(0, ...localEtapas.map(e => e.ordem)) + 1;
    setLocalEtapas(prev => [
      ...prev,
      {
        agenda_id: '', // Será preenchido pela RPC
        tenant_id: '', // Será preenchido pela RPC com auth.uid()
        ordem: newOrdem,
        titulo: '',
        descricao: '',
        prevista_para: undefined,
        status: 'PENDENTE',
        responsavel_contato_id: undefined,
      } as any
    ]);
  };

  const removeEtapa = (index: number) => {
    setLocalEtapas(prev => prev.filter((_, i) => i !== index));
  };

  const updateEtapa = (index: number, field: keyof Omit<AgendaEtapa, 'id'>, value: any) => {
    setLocalEtapas(prev => prev.map((etapa, i) => 
      i === index ? { ...etapa, [field]: value } : etapa
    ));
  };

  const moveEtapa = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localEtapas.length) return;

    setLocalEtapas(prev => {
      const newEtapas = [...prev];
      [newEtapas[index], newEtapas[newIndex]] = [newEtapas[newIndex], newEtapas[index]];
      
      // Reordenar os números de ordem
      return newEtapas.map((etapa, i) => ({ ...etapa, ordem: i + 1 }));
    });
  };

  const getStatusIcon = (status: AgendaEtapa['status']) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock className="w-4 h-4" />;
      case 'EM_ANDAMENTO':
        return <Play className="w-4 h-4" />;
      case 'CONCLUIDA':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELADA':
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: AgendaEtapa['status']) => {
    switch (status) {
      case 'PENDENTE':
        return 'default';
      case 'EM_ANDAMENTO':
        return 'warning';
      case 'CONCLUIDA':
        return 'success';
      case 'CANCELADA':
        return 'destructive';
    }
  };

  const handleStatusChange = (etapa: AgendaEtapa, newStatus: AgendaEtapa['status']) => {
    if (onStatusChange && 'id' in etapa) {
      onStatusChange(etapa.id, newStatus);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definida';
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Etapas do Agendamento</h3>
        {editMode && (
          <Button
            type="button"
            onClick={addEtapa}
            disabled={disabled}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Etapa
          </Button>
        )}
      </div>

      {localEtapas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {editMode 
                ? 'Nenhuma etapa criada. Clique em "Nova Etapa" para começar.'
                : 'Nenhuma etapa definida para esta agenda.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {localEtapas
            .sort((a, b) => a.ordem - b.ordem)
            .map((etapa, index) => {
              const etapaCompleta = etapas.find(e => e.ordem === etapa.ordem);
              
              return (
                <Card key={`${etapa.ordem}-${index}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {etapa.ordem}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(etapa.status)}
                          <Badge variant={getStatusColor(etapa.status) as any} className="text-xs">
                            {etapa.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!editMode && etapaCompleta && onStatusChange && (
                          <Select
                            value={etapa.status}
                            onValueChange={(value) => handleStatusChange(etapaCompleta, value as AgendaEtapa['status'])}
                            disabled={disabled}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDENTE">Pendente</SelectItem>
                              <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                              <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                              <SelectItem value="CANCELADA">Cancelada</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        {editMode && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveEtapa(index, 'up')}
                              disabled={disabled || index === 0}
                            >
                              <GripVertical className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEtapa(index)}
                              disabled={disabled}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {editMode ? (
                      <>
                        {/* Título */}
                        <div className="space-y-2">
                          <Label>Título da Etapa</Label>
                          <Input
                            value={etapa.titulo}
                            onChange={(e) => updateEtapa(index, 'titulo', e.target.value)}
                            placeholder="Digite o título da etapa..."
                            disabled={disabled}
                          />
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Textarea
                            value={etapa.descricao || ''}
                            onChange={(e) => updateEtapa(index, 'descricao', e.target.value)}
                            placeholder="Descrição detalhada da etapa..."
                            disabled={disabled}
                            rows={2}
                          />
                        </div>

                        {/* Data Prevista */}
                        <div className="space-y-2">
                          <Label>Data Prevista</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !etapa.prevista_para && "text-muted-foreground"
                                )}
                                disabled={disabled}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {etapa.prevista_para 
                                  ? formatDate(etapa.prevista_para)
                                  : "Selecione uma data"
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={etapa.prevista_para ? new Date(etapa.prevista_para) : undefined}
                                onSelect={(date) => updateEtapa(index, 'prevista_para', date?.toISOString())}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Responsável */}
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Select
                            value={etapa.responsavel_contato_id || 'none'}
                            onValueChange={(value) => updateEtapa(index, 'responsavel_contato_id', value === 'none' ? undefined : value)}
                            disabled={disabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o responsável" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum responsável</SelectItem>
                              {contacts.map((contato) => (
                                <SelectItem key={contato.id} value={contato.id}>
                                  {contato.nome_fantasia}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Visualização */}
                        <div>
                          <h4 className="font-medium">{etapa.titulo}</h4>
                          {etapa.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {etapa.descricao}
                            </p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Data Prevista:</span>
                            <p className="text-muted-foreground">{formatDate(etapa.prevista_para)}</p>
                          </div>
                          
                          {etapa.responsavel_contato_id && (
                            <div>
                              <span className="font-medium">Responsável:</span>
                              <p className="text-muted-foreground">
                                {contacts.find(c => c.id === etapa.responsavel_contato_id)?.nome_fantasia || 'Não encontrado'}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}