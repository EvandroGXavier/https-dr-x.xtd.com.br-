import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, BarChart3, Settings, Phone, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWhatsappV2 } from '@/hooks/useWhatsappV2';
import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function WhatsAppMenu() {
  const { config, loadConfig, threads: conversations } = useWhatsappV2();

  useEffect(() => {
    loadConfig();
  }, []);

  const menuItems = [
    {
      title: 'Conversas',
      description: 'Gerencie suas conversas do WhatsApp',
      icon: MessageCircle,
      href: '/atendimento/whatsapp',
      color: 'bg-green-500',
      stats: conversations?.length || 0
    },
    {
      title: 'Configurações',
      description: 'Configure a integração com WhatsApp',
      icon: Settings,
      href: '/configuracoes',
      color: 'bg-blue-500'
    },
    {
      title: 'Templates',
      description: 'Gerencie templates de mensagens',
      icon: MessageSquare,
      href: '/whatsapp/templates',
      color: 'bg-purple-500'
    },
    {
      title: 'Relatórios',
      description: 'Visualize estatísticas e relatórios',
      icon: BarChart3,
      href: '/whatsapp/relatorios',
      color: 'bg-orange-500'
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Business</h1>
            <p className="text-muted-foreground mt-1">
              Central de gerenciamento do WhatsApp
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {config ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Conectado: {config.instance_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">
                  Não configurado
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{conversations?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Conversas Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {conversations?.filter(c => c.status === 'open').length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {config ? 1 : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Instâncias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${item.color} text-white`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      {item.stats !== undefined && (
                        <Badge variant="secondary" className="mt-1">
                          {item.stats}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link to="/atendimento/whatsapp">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Iniciar Atendimento
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/configuracoes">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar WhatsApp
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/whatsapp/templates">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Gerenciar Templates
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}