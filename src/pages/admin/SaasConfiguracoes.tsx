import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { PlanoTemplateConfig } from '@/components/admin/saas/PlanoTemplateConfig';
import { FEATURES } from '@/config/features';

export default function SaasConfiguracoes() {
  const navigate = useNavigate();

  if (!FEATURES.SAAS_CORE_V1) {
    navigate('/');
    return null;
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/saas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao SaaS
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações SaaS</h1>
            <p className="text-muted-foreground">
              Configure templates e padrões do sistema
            </p>
          </div>
        </div>

        <PlanoTemplateConfig />
      </div>
    </AppLayout>
  );
}
