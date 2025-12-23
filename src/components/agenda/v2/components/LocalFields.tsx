import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AgendaLocal } from '@/hooks/useAgendaV2';
import { MapPin, Link2, Folder } from 'lucide-react';

interface LocalFieldsProps {
  local: AgendaLocal | null;
  onChange: (local: Omit<AgendaLocal, 'id'>) => void;
  disabled?: boolean;
}

export function LocalFields({ local, onChange, disabled }: LocalFieldsProps) {
  const [localData, setLocalData] = useState<Omit<AgendaLocal, 'id'>>({
    agenda_id: '',
    modalidade: 'PRESENCIAL',
    endereco: '',
    link: '',
    pasta_arquivos: '',
  });

  // Sincronizar com props
  useEffect(() => {
    if (local) {
      setLocalData({
        agenda_id: local.agenda_id,
        modalidade: local.modalidade,
        endereco: local.endereco || '',
        link: local.link || '',
        pasta_arquivos: local.pasta_arquivos || '',
      });
    }
  }, [local]);

  // Notificar mudanças
  useEffect(() => {
    onChange(localData);
  }, [localData, onChange]);

  const updateLocal = (field: keyof Omit<AgendaLocal, 'id'>, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Modalidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modalidade</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={localData.modalidade}
            onValueChange={(value) => updateLocal('modalidade', value as AgendaLocal['modalidade'])}
            disabled={disabled}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PRESENCIAL" id="presencial" />
              <Label htmlFor="presencial" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Presencial
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ONLINE" id="online" />
              <Label htmlFor="online" className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Online
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Campos condicionais */}
      {localData.modalidade === 'PRESENCIAL' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Local Presencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={localData.endereco}
                onChange={(e) => updateLocal('endereco', e.target.value)}
                placeholder="Digite o endereço completo do local..."
                disabled={disabled}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {localData.modalidade === 'ONLINE' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Reunião Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="link">Link da Reunião</Label>
              <Input
                id="link"
                type="url"
                value={localData.link}
                onChange={(e) => updateLocal('link', e.target.value)}
                placeholder="https://meet.google.com/..."
                disabled={disabled}
              />
              <p className="text-xs text-muted-foreground">
                Link para acesso à reunião online (Google Meet, Zoom, Teams, etc.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pasta de Arquivos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Folder className="w-4 h-4" />
            Pasta de Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="pasta_arquivos">Caminho da Pasta</Label>
            <Input
              id="pasta_arquivos"
              value={localData.pasta_arquivos}
              onChange={(e) => updateLocal('pasta_arquivos', e.target.value)}
              placeholder="Ex: \\servidor\projetos\agenda_2024\..."
              disabled={disabled}
            />
            <p className="text-xs text-muted-foreground">
              Caminho da pasta de rede ou local onde serão armazenados os arquivos relacionados
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}