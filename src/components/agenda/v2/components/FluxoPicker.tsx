import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFluxos, FluxoCompleto } from '@/hooks/useFluxos';
import { Loader2, Workflow, Clock } from 'lucide-react';

interface FluxoPickerProps {
  value?: string;
  onValueChange: (fluxoId: string | undefined, fluxo: FluxoCompleto | null) => void;
  disabled?: boolean;
}

export function FluxoPicker({ value, onValueChange, disabled }: FluxoPickerProps) {
  const { fluxos, loading } = useFluxos();
  const [selectedFluxo, setSelectedFluxo] = useState<FluxoCompleto | null>(null);

  const handleFluxoChange = async (fluxoId: string) => {
    if (fluxoId === 'none') {
      setSelectedFluxo(null);
      onValueChange(undefined, null);
      return;
    }

    const fluxo = fluxos.find(f => f.id === fluxoId) || null;
    setSelectedFluxo(fluxo);
    onValueChange(fluxoId, fluxo);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fluxo">Fluxo de Agendamento</Label>
        <Select
          value={value || 'none'}
          onValueChange={handleFluxoChange}
          disabled={disabled || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um fluxo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <span>Sem fluxo específico</span>
              </div>
            </SelectItem>
            {loading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando fluxos...
                </div>
              </SelectItem>
            ) : (
              fluxos.map((fluxo) => (
                <SelectItem key={fluxo.id} value={fluxo.id}>
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4" />
                    <span>{fluxo.nome}</span>
                    <Badge variant="secondary" className="text-xs">
                      {fluxo.etapas.length} etapas
                    </Badge>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedFluxo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Workflow className="w-4 h-4" />
              {selectedFluxo.nome}
            </CardTitle>
            {selectedFluxo.descricao && (
              <CardDescription>{selectedFluxo.descricao}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Etapas que serão criadas:</h4>
              <div className="space-y-1">
                {selectedFluxo.etapas
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((etapa) => (
                    <div
                      key={etapa.id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {etapa.ordem}
                        </Badge>
                        <span>{etapa.titulo}</span>
                        {etapa.obrigatoria && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs">
                          {etapa.offset_dias > 0 ? '+' : ''}
                          {etapa.offset_dias} dias
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}