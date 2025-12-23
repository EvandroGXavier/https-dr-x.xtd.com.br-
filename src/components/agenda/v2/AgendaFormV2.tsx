import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCtrlS } from "@/hooks/useCtrlS";
import { useAgendaV2, AgendaV2, AgendaParte, AgendaLocal, AgendaEtapa } from "@/hooks/useAgendaV2";
import { useUserTenant } from "@/hooks/useUserTenant";
import { useContextualReturn } from "@/hooks/useContextualReturn";
import { AgendaTab } from "./tabs/AgendaTab";
import { PartesTab } from "./tabs/PartesTab";
import { LocalTab } from "./tabs/LocalTab";
import { EtapasTab } from "./tabs/EtapasTab";
import { useToast } from "@/hooks/use-toast";

// Interface para os dados do formulário
export interface AgendaFormValues {
  agenda: Partial<AgendaV2>;
  partes: Omit<AgendaParte, 'id'>[];
  local: Omit<AgendaLocal, 'id' | 'agenda_id'> | null;
  etapas: Omit<AgendaEtapa, 'id'>[];
  etiqueta_ids?: string[];
}

export function AgendaFormV2() {
  const { id } = useParams();
  const { toast } = useToast();
  const { getContext, goBack } = useContextualReturn();
  const { parentType, parentId, returnTo } = getContext();
  const [activeTab, setActiveTab] = useState("agenda");
  const [hasChanges, setHasChanges] = useState(false);

  const { empresaId, filialId } = useUserTenant();

  const {
    agenda,
    partes,
    local,
    etapas,
    loading,
    saveAgendaCompleta,
  } = useAgendaV2(id);

  // Estado unificado do formulário
  const [formData, setFormData] = useState<AgendaFormValues>({
    agenda: {
      empresa_id: empresaId || undefined,
      filial_id: filialId || undefined,
    },
    partes: [],
    local: null,
    etapas: [],
    etiqueta_ids: [],
  });

  // Atualizar empresa_id/filial_id quando o perfil do usuário carregar
  useEffect(() => {
    if (empresaId) {
      setFormData(prev => ({
        ...prev,
        agenda: {
          ...prev.agenda,
          empresa_id: empresaId,
          filial_id: filialId || undefined,
        }
      }));
    }
  }, [empresaId, filialId]);

  // Sincronizar dados carregados com o estado do formulário
  // Sincronizar dados da agenda principal
  useEffect(() => {
    if (agenda) {
      console.log('📝 [AgendaFormV2] Sincronizando agenda para formData:', agenda);
      setFormData(prev => ({
        ...prev,
        agenda: {
          id: agenda.id,
          titulo: agenda.titulo,
          descricao: agenda.descricao,
          data_inicio: agenda.data_inicio,
          data_fim: agenda.data_fim,
          status: agenda.status,
          prioridade: agenda.prioridade,
          observacoes: agenda.observacoes,
          processo_id: agenda.processo_id,
          fluxo_id: agenda.fluxo_id,
          // Usar valor do banco OU manter do perfil
          empresa_id: agenda.empresa_id || prev.agenda.empresa_id,
          filial_id: agenda.filial_id || prev.agenda.filial_id,
        },
      }));
    }
  }, [agenda]);

  // Sincronizar partes (sempre, mesmo se vazio)
  useEffect(() => {
    console.log('👥 [AgendaFormV2] Sincronizando partes para formData:', partes.length);
    setFormData(prev => ({
      ...prev,
      partes: partes.map(p => ({
        agenda_id: p.agenda_id,
        contato_id: p.contato_id,
        papel: p.papel,
        tenant_id: p.tenant_id,
      })),
    }));
  }, [partes]);

  // Sincronizar local (sempre, mesmo se null)
  useEffect(() => {
    console.log('📍 [AgendaFormV2] Sincronizando local para formData:', local ? 'Sim' : 'Não');
    setFormData(prev => ({
      ...prev,
      local: local ? {
        modalidade: local.modalidade,
        endereco: local.endereco,
        link: local.link,
        pasta_arquivos: local.pasta_arquivos,
      } : null,
    }));
  }, [local]);

  // Sincronizar etapas (sempre, mesmo se vazio)
  useEffect(() => {
    console.log('✅ [AgendaFormV2] Sincronizando etapas para formData:', etapas.length);
    setFormData(prev => ({
      ...prev,
      etapas: etapas.map(e => ({
        agenda_id: e.agenda_id,
        ordem: e.ordem,
        titulo: e.titulo,
        descricao: e.descricao,
        status: e.status,
        prevista_para: e.prevista_para,
        responsavel_contato_id: e.responsavel_contato_id,
        tenant_id: e.tenant_id,
      })),
    }));
  }, [etapas]);

  // Pré-preencher vínculos quando vindo de contexto externo (contato ou processo)
  useEffect(() => {
    if (parentId && !id) {
      console.log('🔗 [AgendaFormV2] Pré-preenchendo contexto:', { parentType, parentId });
      
      // Adicionar contato como SOLICITANTE automaticamente se for contexto de contato
      if (parentType === 'contato') {
        setFormData(prev => ({
          ...prev,
          partes: [
            {
              agenda_id: '',
              contato_id: parentId,
              papel: 'SOLICITANTE',
              tenant_id: '',
            }
          ],
        }));
      }
      
      // Se for contexto de processo, associar à agenda
      if (parentType === 'processo') {
        setFormData(prev => ({
          ...prev,
          agenda: {
            ...prev.agenda,
            processo_id: parentId,
          }
        }));
      }
      
      // Iniciar na aba de partes para o usuário verificar
      setActiveTab("partes");
    }
  }, [parentId, parentType, id]);

  const handleSave = async () => {
    try {
      setHasChanges(false);
      await saveAgendaCompleta(formData);
      
      // Mensagem de sucesso contextual
      const successMessage = parentType === 'contato'
        ? "✅ Agenda criada com sucesso para o contato."
        : parentType === 'processo'
        ? "✅ Audiência criada com sucesso para o processo."
        : "Agenda salva com sucesso.";
      
      toast({
        title: "Sucesso",
        description: successMessage,
      });
      
      setTimeout(() => {
        goBack();
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agenda",
        variant: "destructive",
      });
    }
  };

  useCtrlS(handleSave);

  const handleBack = () => {
    if (hasChanges) {
      if (confirm("Há alterações não salvas. Deseja sair mesmo assim?")) {
        goBack();
      }
    } else {
      goBack();
    }
  };

  // Handlers para atualizar o estado do formulário
  const handleAgendaChange = (agendaData: Partial<AgendaV2>) => {
    setFormData(prev => ({ ...prev, agenda: agendaData }));
    setHasChanges(true);
  };

  const handlePartesChange = (partesData: Omit<AgendaParte, 'id'>[]) => {
    setFormData(prev => ({ ...prev, partes: partesData }));
    setHasChanges(true);
  };

  const handleLocalChange = (localData: Omit<AgendaLocal, 'id' | 'agenda_id'> | null) => {
    setFormData(prev => ({ ...prev, local: localData }));
    setHasChanges(true);
  };

  const handleEtapasChange = (etapasData: Omit<AgendaEtapa, 'id'>[]) => {
    setFormData(prev => ({ ...prev, etapas: etapasData }));
    setHasChanges(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {id ? "Editar Agenda" : "Nova Agenda"}
              </h1>
              <p className="text-muted-foreground">
                Preencha todas as informações e salve com um único clique
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar (Ctrl+S)
          </Button>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="agenda">Agenda</TabsTrigger>
                <TabsTrigger value="partes">Partes</TabsTrigger>
                <TabsTrigger value="local">Local</TabsTrigger>
                <TabsTrigger value="etapas">Etapas</TabsTrigger>
              </TabsList>

              <TabsContent value="agenda" className="mt-6">
                <AgendaTab 
                  agenda={formData.agenda}
                  onChange={handleAgendaChange}
                />
              </TabsContent>

              <TabsContent value="partes" className="mt-6">
                <PartesTab 
                  partes={formData.partes}
                  onChange={handlePartesChange}
                />
              </TabsContent>

              <TabsContent value="local" className="mt-6">
                <LocalTab 
                  local={formData.local}
                  onChange={handleLocalChange}
                />
              </TabsContent>

              <TabsContent value="etapas" className="mt-6">
                <EtapasTab 
                  etapas={formData.etapas}
                  onChange={handleEtapasChange}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
