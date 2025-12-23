import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PontoAtencao = {
  tipo: 'PRAZO' | 'VALOR' | 'DOCUMENTO';
  descricao: string;
  metadados?: {
    data?: string;
    valor?: number;
    [key: string]: any;
  };
};

interface PontosAtencaoIAProps {
  pontos: PontoAtencao[] | null;
}

export function PontosAtencaoIA({ pontos }: PontosAtencaoIAProps) {
  const navigate = useNavigate();

  if (!pontos || pontos.length === 0) return null;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'PRAZO':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'DOCUMENTO':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'VALOR':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const handleAgendar = () => {
    navigate('/agenda');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Pontos de Atenção
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pontos.map((ponto, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card"
            >
              <div className="mt-0.5">{getIcon(ponto.tipo)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{ponto.descricao}</p>
                {ponto.metadados?.data && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Data: {new Date(ponto.metadados.data).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              {ponto.tipo === 'PRAZO' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAgendar}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
