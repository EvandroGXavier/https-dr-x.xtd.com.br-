import { AppLayout } from '@/components/layout/AppLayout';
import { CapturaInteligente } from '@/components/processos/captura/CapturaInteligente';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function ProcessoCapturaPage() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/processos/kanban')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o Kanban
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Captura Inteligente de Novo Caso</h1>
          <p className="mt-2 text-muted-foreground">
            Arraste arquivos ou cole o texto do caso para iniciar a análise automática.
          </p>
        </div>
        
        <div className="mt-8">
          <CapturaInteligente />
        </div>
      </div>
    </AppLayout>
  );
}
