import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosList } from "@/components/admin/saas/UsuariosList";

export default function SaasUsuarios() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema, configure ramais SIP e permissões
          </p>
        </div>

        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <Card className="p-6">
              <UsuariosList />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
