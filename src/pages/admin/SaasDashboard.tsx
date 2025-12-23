import { useNavigate } from 'react-router-dom';
import { Building, Users, CreditCard, Settings, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { TenantBranchSelector } from '@/components/security/TenantBranchSelector';
import { FEATURES } from '@/config/features';

export default function SaasDashboard() {
  const navigate = useNavigate();

  // Verificar se a feature está habilitada
  if (!FEATURES.SAAS_CORE_V1) {
    navigate('/');
    return null;
  }

  const menuItems = [
    {
      title: 'Empresas',
      description: 'Gerencie empresas, planos e configurações',
      icon: Building,
      path: '/admin/saas/empresas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Usuários e Vínculos',
      description: 'Controle usuários, perfis e permissões',
      icon: Users,
      path: '/admin/saas/usuarios',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Planos e Cobrança',
      description: 'Configure planos, valores e vencimentos',
      icon: CreditCard,
      path: '/admin/saas/planos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Configurações',
      description: 'Configurações gerais do sistema SaaS',
      icon: Settings,
      path: '/admin/saas/configuracoes',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SaaS Administration</h1>
            <p className="text-muted-foreground mt-2">
              Sistema de gestão multi-tenant com controle de empresas e filiais
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Multi-Tenant V1
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={item.path}
                    className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-transparent hover:border-l-primary"
                    onClick={() => navigate(item.path)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.bgColor}`}>
                          <IconComponent className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Seção de acesso rápido */}
            <Card>
              <CardHeader>
                <CardTitle>Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/admin/saas/empresas')}
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Nova Empresa
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/admin/saas/usuarios')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gerir Usuários
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => navigate('/admin/saas/planos')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Config. Planos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com seletor de contexto */}
          <div className="space-y-6">
            {FEATURES.SAAS_CONTEXT_V1 && <TenantBranchSelector />}
            
            {/* Informações do sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SaaS Core:</span>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Context Switching:</span>
                  <Badge variant={FEATURES.SAAS_CONTEXT_V1 ? "default" : "secondary"}>
                    {FEATURES.SAAS_CONTEXT_V1 ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Multi-Tenant:</span>
                  <Badge variant="default">RLS Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}