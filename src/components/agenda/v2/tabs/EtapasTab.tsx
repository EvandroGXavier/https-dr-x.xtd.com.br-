import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EtapasEditor } from '../components/EtapasEditor';
import { AgendaEtapa } from '@/hooks/useAgendaV2';
import { CheckSquare, Info } from 'lucide-react';

interface EtapasTabProps {
  etapas: Omit<AgendaEtapa, 'id'>[];
  onChange: (etapas: Omit<AgendaEtapa, 'id'>[]) => void;
}

export function EtapasTab({ etapas, onChange }: EtapasTabProps) {
  const [localEtapas, setLocalEtapas] = useState<Omit<AgendaEtapa, 'id'>[]>([]);

  // Sincronizar estado local com props (apenas quando etapas muda externamente)
  useEffect(() => {
    setLocalEtapas(etapas);
  }, [etapas]);

  // Memoizar a função de mudança para evitar loops infinitos
  const handleEtapasChange = useCallback((novasEtapas: Omit<AgendaEtapa, 'id'>[]) => {
    setLocalEtapas(novasEtapas);
    onChange(novasEtapas);
  }, [onChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Etapas do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Sobre as Etapas</p>
              <p>
                As etapas ajudam a organizar o fluxo de trabalho do agendamento. 
                Se você selecionou um fluxo na aba "Agenda", as etapas foram pré-preenchidas, 
                mas você pode editá-las conforme necessário.
              </p>
            </div>
          </div>

          <EtapasEditor
            etapas={localEtapas as AgendaEtapa[]}
            onChange={handleEtapasChange}
            editMode={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
