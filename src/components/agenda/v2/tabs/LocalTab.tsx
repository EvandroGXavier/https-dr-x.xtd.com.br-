import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalFields } from '../components/LocalFields';
import { AgendaLocal } from '@/hooks/useAgendaV2';
import { MapPin } from 'lucide-react';

interface LocalTabProps {
  local: Omit<AgendaLocal, 'id' | 'agenda_id'> | null;
  onChange: (local: Omit<AgendaLocal, 'id' | 'agenda_id'> | null) => void;
}

export function LocalTab({ local, onChange }: LocalTabProps) {
  const [localData, setLocalData] = useState<Omit<AgendaLocal, 'id' | 'agenda_id'> | null>(null);

  // Sincronizar estado local com props
  useEffect(() => {
    setLocalData(local);
  }, [local]);

  const handleLocalChange = (novoLocal: Omit<AgendaLocal, 'id'>) => {
    // Remover agenda_id se existir - será adicionado pela RPC
    const localSemAgendaId: Omit<AgendaLocal, 'id' | 'agenda_id'> = {
      modalidade: novoLocal.modalidade,
      endereco: novoLocal.endereco,
      link: novoLocal.link,
      pasta_arquivos: novoLocal.pasta_arquivos,
    };
    setLocalData(localSemAgendaId);
    onChange(localSemAgendaId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Local do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            Configure o local onde o agendamento será realizado, seja presencial ou online.
          </p>
          
          <LocalFields
            local={localData as AgendaLocal | null}
            onChange={handleLocalChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
