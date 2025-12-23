import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContatoCompleto } from '@/types/contatos';
import { FEATURES } from '@/config/features';
import { ContatoQuickActions } from './ContatoQuickActions';
import { validarCPF } from '@/lib/cpf';
import { validarCNPJ } from '@/lib/cnpj';

// Importar as abas (serão criadas em seguida)
import { ContatoTab } from './tabs/ContatoTab';
import { EnderecosTab } from './tabs/EnderecosTab';
import { PFTab } from './tabs/PFTab';
import { PJTab } from './tabs/PJTab';
import { VinculosTab } from './tabs/VinculosTab';
import { MeiosContatoTab } from './tabs/MeiosContatoTab';
import { PatrimonioTab } from './tabs/PatrimonioTab';
import { AgendaTab } from './tabs/AgendaTab';
import { ProcessosTab } from './tabs/ProcessosTab';
import { DocsList } from '@/components/docs/DocsList';
import { ContratosTab } from './tabs/ContratosTab';
import { FinanceiroTab } from './tabs/FinanceiroTab';
import { ADMTab } from './tabs/ADMTab';
import { WhatsAppTab } from './tabs/WhatsAppTab';

interface ContatosTabsProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function ContatosTabs({ contato, onUpdate, isEditing = false }: ContatosTabsProps) {
  const [activeTab, setActiveTab] = useState('contato');
  
  // Determine which tabs to show based on CPF/CNPJ
  const cpfCnpjDigits = (contato.cpf_cnpj || '').replace(/\D/g, '');
  const showPF = cpfCnpjDigits.length === 11 && validarCPF(cpfCnpjDigits);
  const showPJ = cpfCnpjDigits.length === 14 && validarCNPJ(cpfCnpjDigits);

  if (!FEATURES.CONTATOS_V2) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Sistema de contatos V2 não habilitado
      </div>
    );
  }

  const tabs = [
    { id: 'contato', label: 'Contato', component: ContatoTab, show: true },
    { id: 'enderecos', label: 'Endereços', component: EnderecosTab, show: true },
    { id: 'pf', label: 'PF', component: PFTab, show: showPF },
    { id: 'pj', label: 'PJ', component: PJTab, show: showPJ },
    { id: 'vinculos', label: 'Vínculos', component: VinculosTab, show: true },
    { id: 'meios', label: 'Contatos', component: MeiosContatoTab, show: true },
    { id: 'whatsapp', label: 'WhatsApp', component: () => <WhatsAppTab contato={contato} />, show: true },
    { id: 'patrimonio', label: 'Patrimônio', component: () => <PatrimonioTab contatoId={contato.id} />, show: true },
    { id: 'agenda', label: 'Agenda', component: AgendaTab, show: true },
    { id: 'processos', label: 'Processos', component: ProcessosTab, show: true },
    { id: 'anexos', label: 'Anexos', component: () => <DocsList vinculoTipo="contato" vinculoId={contato.id} />, show: true },
    { id: 'contratos', label: 'Contratos', component: ContratosTab, show: true },
    { id: 'financeiro', label: 'Financeiro', component: FinanceiroTab, show: true },
    { id: 'adm', label: 'ADM', component: ADMTab, show: true },
  ].filter(tab => tab.show);

  return (
    <Card className="w-full">
      {FEATURES.CONTATOS_V2_FIX && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>{contato.nome_fantasia || 'Contato'}</span>
            <ContatoQuickActions 
              contato={{
                id: contato.id,
                celular: contato.celular,
                telefone: contato.telefone,
                email: contato.email,
                endereco: contato.endereco
              }}
              showLinks={FEATURES.LINK_AGENDA_EM_CONTATOS}
            />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 lg:grid-cols-13 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-sm px-2 py-1.5 whitespace-nowrap"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <div className="p-6">
                  {/* Only render the component if this tab is active to prevent all tabs loading at once */}
                  {activeTab === tab.id && (
                    <Component
                      contato={contato}
                      onUpdate={onUpdate}
                      isEditing={isEditing}
                    />
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}