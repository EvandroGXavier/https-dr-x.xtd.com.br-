import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmpresasList } from '@/components/admin/saas/EmpresasList';
import { PlanosList } from '@/components/admin/saas/PlanosList';
import { AssinaturasList } from '@/components/admin/saas/AssinaturasList';
import { useSaasAccess } from '@/hooks/useSaasAccess';

export default function SaasEmpresas() {
  const navigate = useNavigate();
  const { hasAccess, featureOn } = useSaasAccess();

  // Verificar acesso unificado
  if (!featureOn || !hasAccess) {
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
            <h1 className="text-2xl font-bold">Gestão de Empresas</h1>
            <p className="text-muted-foreground">
              Gerencie as empresas do sistema SaaS
            </p>
          </div>
        </div>

        <Tabs defaultValue="empresas" className="w-full">
          <TabsList>
            <TabsTrigger value="empresas">Empresas</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="mt-6">
            <EmpresasList />
          </TabsContent>

          <TabsContent value="planos" className="mt-6">
            <PlanosList />
          </TabsContent>

          <TabsContent value="assinaturas" className="mt-6">
            <AssinaturasList />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}