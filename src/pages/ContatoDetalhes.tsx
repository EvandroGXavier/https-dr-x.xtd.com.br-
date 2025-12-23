import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { ContatosTabs } from "@/components/contatos/ContatosTabs";
import { ContatoHeader } from "@/components/contatos/ContatoHeader";
import { ContatoTimeline } from "@/components/contatos/ContatoTimeline";
import { ContatoStats } from "@/components/contatos/ContatoStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ContatoCompleto } from "@/types/contatos";
import { useContatoInteracoes } from "@/hooks/useContatoInteracoes";
import { FEATURES } from "@/config/features";

export default function ContatoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contato, isLoading, error, refetch } = useQuery({
    queryKey: ["contato", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do contato não fornecido");
      
      const { data, error } = await supabase
        .from("vw_contatos_completo")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ContatoCompleto;
    },
    enabled: !!id,
  });

  const { interacoes, loading: loadingInteracoes } = useContatoInteracoes(id);

  const handleUpdate = (updatedContato: ContatoCompleto) => {
    refetch();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !contato) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/contatos")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Contato não encontrado</h1>
          </div>
          <p className="text-muted-foreground">
            O contato solicitado não foi encontrado ou você não tem permissão para acessá-lo.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <Button
            onClick={() => navigate(`/contatos/${id}/editar`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {FEATURES.CONTATOS_V2 ? (
          <div className="space-y-6">
            <ContatoHeader contato={contato} />
            
            <ContatoStats interacoes={interacoes} />
            
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dados" className="mt-6">
                <ContatosTabs 
                  contato={contato}
                  onUpdate={handleUpdate}
                  isEditing={false}
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-6">
                <ContatoTimeline 
                  interacoes={interacoes} 
                  loading={loadingInteracoes} 
                />
              </TabsContent>
              
              <TabsContent value="documentos" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">
                      Módulo de documentos em desenvolvimento
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Sistema de contatos V2 não habilitado
          </div>
        )}
      </div>
    </AppLayout>
  );
}
