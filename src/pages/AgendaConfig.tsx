import { AppLayout } from '@/components/layout/AppLayout';
import AgendaConfigList from '@/components/agenda/AgendaConfigList';
import { useHasRole } from '@/hooks/useHasRole';
import { Navigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function AgendaConfig() {
  const { hasRole, loading } = useHasRole('admin');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </AppLayout>
    );
  }

  if (!hasRole) {
    return <Navigate to="/agenda" replace />;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Configurações de Agendas
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Configure fluxos de agendas automáticas para diferentes módulos do sistema
          </p>
        </div>

        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Área Administrativa</AlertTitle>
          <AlertDescription>
            As configurações aqui definidas afetam a criação automática de agendas em
            todo o sistema. Configure com cuidado e teste antes de ativar.
          </AlertDescription>
        </Alert>

        <AgendaConfigList />
      </div>
    </AppLayout>
  );
}
