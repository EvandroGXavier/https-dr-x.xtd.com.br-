import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PartesSelector } from '../components/PartesSelector';
import { AgendaParte } from '@/hooks/useAgendaV2';
import { Users, Info } from 'lucide-react';

interface PartesTabProps {
  partes: Omit<AgendaParte, 'id'>[];
  onChange: (partes: Omit<AgendaParte, 'id'>[]) => void;
}

export function PartesTab({ partes, onChange }: PartesTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Partes Envolvidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Sobre as Partes</p>
              <p>
                Adicione todos os contatos envolvidos nesta agenda. Você pode especificar o papel 
                de cada um (Responsável, Solicitante, Envolvido, etc.). Esta é a única aba onde os 
                participantes devem ser gerenciados.
              </p>
            </div>
          </div>

          <PartesSelector
            partes={partes}
            onChange={onChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
