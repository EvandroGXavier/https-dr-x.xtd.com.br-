import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DebugPanel from "@/components/debug/DebugPanel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FEATURES } from "@/config/features";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useDefaultTags } from "@/hooks/useDefaultTags";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlobalContactHotkey } from "@/components/global/GlobalContactHotkey";
import Index from "./pages/Index";
import Contatos from "./pages/Contatos";
import Etiquetas from "./pages/Etiquetas";
import Agenda from "./pages/Agenda";
import Configuracoes from "./pages/Configuracoes";
import Financeiro from "./pages/Financeiro";
import ContasFinanceiras from "./pages/ContasFinanceiras";
import Processos from "./pages/Processos";
import ProcessosKanban from "./pages/ProcessosKanban";
import FunilAtendimento from "./pages/FunilAtendimento";
import ProcessoCaptura from "./pages/ProcessoCaptura";
import ProcessoForm from "./pages/ProcessoForm";
import ProcessoDetalhes from "./pages/ProcessoDetalhes";
import ProcessoConfiguracoes from "./pages/ProcessoConfig";
import ProcessoConfig from "./pages/ProcessoConfig";
import ContatoEditar from "./pages/ContatoEditar";
import ContatoNovo from "./pages/ContatoNovo";
import ContatoDetalhes from "./pages/ContatoDetalhes";
import WhatsApp from "./pages/WhatsApp";
import Telefonia from "./pages/Telefonia";
// WhatsAppEvolution removido - usando sistema novo
import WhatsAppMenu from "./pages/WhatsAppMenu";

import Biblioteca from "./pages/Biblioteca";
import EmailConfiguracoes from "./pages/EmailConfiguracoes";
import EmailTriggers from "./pages/EmailTriggers";
import EmailLogs from "./pages/EmailLogs";
import Auth from "./pages/Auth";
import RedefinirSenha from "./pages/RedefinirSenha";
import NotFound from "./pages/NotFound";
import Ajuda from "./pages/Ajuda";
import { useGlobalF1 } from "./hooks/useGlobalF1";
import { AgendaFormV2 } from "@/components/agenda/v2/AgendaFormV2";
import AgendaConfig from "./pages/AgendaConfig";

import Saas from "@/pages/Saas";
import SaasDashboard from "@/pages/admin/SaasDashboard";
import SaasEmpresas from "@/pages/admin/SaasEmpresas";
import SaasUsuarios from "@/pages/admin/SaasUsuarios";
import SaasConfiguracoes from "@/pages/admin/SaasConfiguracoes";
import ConfiguracaoInicial from "@/pages/ConfiguracaoInicial";
import Integracao from "./pages/Integracao";
import IntegracaoConfiguracoes from "./pages/IntegracaoConfiguracoes";
import IntegracaoFila from "./pages/IntegracaoFila";
import Compras from "./pages/Compras";
import CompraDetalhes from "./pages/CompraDetalhes";
import CompraForm from "./pages/CompraForm";
import Vendas from "./pages/Vendas";
import VendaForm from "./pages/VendaForm";
import VendaDetalhes from "./pages/VendaDetalhes";
import Produtos from "./pages/Produtos";
import Estoque from "./pages/Estoque";
import RelatoriosCompras from "./pages/RelatoriosCompras";
import RelatoriosEstoque from "./pages/RelatoriosEstoque";
import XavierConnectPage from "./pages/atendimento/XavierConnect";

const WhatsAppAtendimento = lazy(() => import('@/pages/atendimento/WhatsAppV2'));

const queryClient = new QueryClient();

const AppContent = () => {
  useDefaultTags(); // Criar etiquetas padrão automaticamente

  return (
    <AppWithRouter />
  );
};

const AppWithRouter = () => {
  useGlobalF1(); // Hook global para F1 abrir ajuda (dentro do Router)

  return (
    <>
      <GlobalContactHotkey />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/redefinir-senha" element={<RedefinirSenha />} />
        <Route path="/configuracao-inicial" element={
          <ProtectedRoute>
            <ConfiguracaoInicial />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/contatos" element={
          <ProtectedRoute>
            <Contatos />
          </ProtectedRoute>
        } />
        <Route path="/contatos/novo" element={
          <ProtectedRoute>
            <ContatoNovo />
          </ProtectedRoute>
        } />
        <Route path="/contatos/:id" element={
          <ProtectedRoute>
            <ContatoDetalhes />
          </ProtectedRoute>
        } />
        <Route path="/contatos/:id/editar" element={
          <ProtectedRoute>
            <ContatoEditar />
          </ProtectedRoute>
        } />
        <Route path="/etiquetas" element={
          <ProtectedRoute>
            <Etiquetas />
          </ProtectedRoute>
        } />
        <Route path="/agenda" element={
          <ProtectedRoute>
            <Agenda />
          </ProtectedRoute>
        } />
        <Route path="/agenda/v2/novo" element={
          <ProtectedRoute>
            <AgendaFormV2 />
          </ProtectedRoute>
        } />
        <Route path="/agenda/v2/:id" element={
          <ProtectedRoute>
            <AgendaFormV2 />
          </ProtectedRoute>
        } />
        <Route path="/agenda/config" element={
          <ProtectedRoute>
            <AgendaConfig />
          </ProtectedRoute>
        } />
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <Configuracoes />
          </ProtectedRoute>
        } />
        <Route path="/financeiro" element={
          <ProtectedRoute>
            <Financeiro />
          </ProtectedRoute>
        } />
        <Route path="/financeiro/contas" element={
          <ProtectedRoute>
            <ContasFinanceiras />
          </ProtectedRoute>
        } />
        <Route path="/processos" element={
          <ProtectedRoute>
            <Processos />
          </ProtectedRoute>
        } />
        <Route path="/processos/funil" element={
          <ProtectedRoute>
            <FunilAtendimento />
          </ProtectedRoute>
        } />
        <Route path="/processos/captura" element={
          <ProtectedRoute>
            <ProcessoCaptura />
          </ProtectedRoute>
        } />
        <Route path="/processos/novo" element={
          <ProtectedRoute>
            <ProcessoForm />
          </ProtectedRoute>
        } />
        <Route path="/processos/:id/editar" element={
          <ProtectedRoute>
            <ProcessoForm />
          </ProtectedRoute>
        } />
        <Route path="/processos/:id" element={
          <ProtectedRoute>
            <ProcessoDetalhes />
          </ProtectedRoute>
        } />
        <Route path="/processos/configuracoes" element={
          <ProtectedRoute>
            <ProcessoConfiguracoes />
          </ProtectedRoute>
        } />
        <Route path="/processos/configuracoes" element={
          <ProtectedRoute>
            <ProcessoConfig />
          </ProtectedRoute>
        } />
        <Route path="/whatsapp" element={
          <ProtectedRoute>
            <WhatsAppMenu />
          </ProtectedRoute>
        } />
        <Route path="/telefonia" element={
          <ProtectedRoute>
            <Telefonia />
          </ProtectedRoute>
        } />
        {/* WhatsApp Evolution removido - usando sistema novo */}
        <Route path="/biblioteca/*" element={
          <ProtectedRoute>
            <Biblioteca />
          </ProtectedRoute>
        } />

        {/* Email Routes */}
        <Route path="/emails" element={
          <ProtectedRoute>
            <AppLayout><EmailConfiguracoes /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/emails/configuracoes" element={
          <ProtectedRoute>
            <AppLayout><EmailConfiguracoes /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/emails/triggers" element={
          <ProtectedRoute>
            <AppLayout><EmailTriggers /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/emails/logs" element={
          <ProtectedRoute>
            <AppLayout><EmailLogs /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/saas" element={
          <ProtectedRoute>
            <Saas />
          </ProtectedRoute>
        } />

        {/* SaaS Core Routes */}
        <Route path="/admin/saas" element={
          <ProtectedRoute>
            <SaasDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/saas/empresas" element={
          <ProtectedRoute>
            <SaasEmpresas />
          </ProtectedRoute>
        } />
        <Route path="/admin/saas/configuracoes" element={
          <ProtectedRoute>
            <SaasConfiguracoes />
          </ProtectedRoute>
        } />

        {/* Integração Judiciária Routes */}
        <Route path="/integracao" element={
          <ProtectedRoute>
            <Integracao />
          </ProtectedRoute>
        } />
        <Route path="/integracao/configuracoes" element={
          <ProtectedRoute>
            <IntegracaoConfiguracoes />
          </ProtectedRoute>
        } />
        <Route path="/integracao/fila" element={
          <ProtectedRoute>
            <IntegracaoFila />
          </ProtectedRoute>
        } />

        {/* Compras e Estoque Routes */}
        <Route path="/compras" element={
          <ProtectedRoute>
            <Compras />
          </ProtectedRoute>
        } />
        <Route path="/compras/nova" element={
          <ProtectedRoute>
            <CompraForm />
          </ProtectedRoute>
        } />
        <Route path="/compras/:id" element={
          <ProtectedRoute>
            <CompraDetalhes />
          </ProtectedRoute>
        } />
        <Route path="/produtos" element={
          <ProtectedRoute>
            <Produtos />
          </ProtectedRoute>
        } />
        <Route path="/estoque" element={
          <ProtectedRoute>
            <Estoque />
          </ProtectedRoute>
        } />
        <Route path="/vendas" element={
          <ProtectedRoute>
            <Vendas />
          </ProtectedRoute>
        } />
        <Route path="/vendas/nova" element={
          <ProtectedRoute>
            <VendaForm />
          </ProtectedRoute>
        } />
        <Route path="/vendas/:id" element={
          <ProtectedRoute>
            <VendaDetalhes />
          </ProtectedRoute>
        } />
        <Route path="/relatorios/compras" element={
          <ProtectedRoute>
            <RelatoriosCompras />
          </ProtectedRoute>
        } />
        <Route path="/relatorios/estoque" element={
          <ProtectedRoute>
            <RelatoriosEstoque />
          </ProtectedRoute>
        } />

        <Route path="/atendimento" element={
          <ProtectedRoute>
            <XavierConnectPage />
          </ProtectedRoute>
        } />

        <Route path="/atendimento/whatsapp" element={
          <ProtectedRoute>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando atendimento WhatsApp...</div>}>
              <WhatsAppAtendimento />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/ajuda" element={
          <ProtectedRoute>
            <Ajuda />
          </ProtectedRoute>
        } />

        {/* Admin SaaS Routes */}
        <Route path="/admin/saas/dashboard" element={<ProtectedRoute><SaasDashboard /></ProtectedRoute>} />
        <Route path="/admin/saas/empresas" element={<ProtectedRoute><SaasEmpresas /></ProtectedRoute>} />
        <Route path="/admin/saas/usuarios" element={<ProtectedRoute requiredRole="admin"><SaasUsuarios /></ProtectedRoute>} />
        <Route path="/admin/saas/configuracoes" element={<ProtectedRoute><SaasConfiguracoes /></ProtectedRoute>} />

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        {FEATURES.DEBUG_PANEL && <DebugPanel />}
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
