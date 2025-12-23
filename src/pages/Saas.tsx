import { AppLayout } from "@/components/layout/AppLayout";
import { useSaasAccess } from "@/hooks/useSaasAccess";
import { useSaasData } from "@/components/admin/saas/hooks/useSaasData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmpresasGrid from "@/components/admin/saas/grids/EmpresasGrid";
import { EmpresasList } from "@/components/admin/saas/EmpresasList";
import PlanoForm from "@/components/admin/saas/forms/PlanoForm";
import AssinaturaForm from "@/components/admin/saas/forms/AssinaturaForm";
import AdminInicialForm from "@/components/admin/saas/forms/AdminInicialForm";
import { Building2, CreditCard, Package, UserCog, Shield } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Saas() {
  const { hasAccess, featureOn, isSuperAdmin, isAuthorizedEmail } = useSaasAccess();
  const { planos, loading, refetchData } = useSaasData();

  // Logs para debug
  console.log('🏭 Página SaaS acessada:', {
    featureOn,
    isSuperAdmin,
    isAuthorizedEmail,
    hasAccess,
    loading
  });

  // Redirecionar se não tiver acesso
  if (!hasAccess) {
    console.log('❌ Acesso negado ao SaaS');
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando dados SaaS...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Administração SaaS
              </h1>
              <p className="text-muted-foreground">
                Gerenciamento de empresas, planos e assinaturas
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="empresas" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresas
            </TabsTrigger>
            <TabsTrigger value="planos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="assinaturas" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              Admin Inicial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="empresas" className="mt-6">
            <EmpresasList />
          </TabsContent>

          <TabsContent value="planos" className="mt-6 space-y-6">
            {/* Formulário para criar novo plano */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Criar Novo Plano
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlanoForm onSuccess={refetchData} />
              </CardContent>
            </Card>

            {/* Lista de planos existentes */}
            <Card>
              <CardHeader>
                <CardTitle>Planos Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                {planos && planos.length > 0 ? (
                  <div className="grid gap-4">
                    {planos.map((plano) => (
                      <div
                        key={plano.plano_id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{plano.nome}</h3>
                          <Badge variant="outline">
                            R$ {plano.valor_padrao?.toFixed(2) || '0.00'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plano.descricao}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Limite de usuários: {plano.limite_usuarios || 'Ilimitado'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum plano cadastrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assinaturas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Gerenciar Assinaturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssinaturaForm onSuccess={refetchData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Configuração Admin Inicial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminInicialForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}