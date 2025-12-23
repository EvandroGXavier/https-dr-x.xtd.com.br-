import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ContatosTabs } from "@/components/contatos/ContatosTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ContatoCompleto } from "@/types/contatos";
import { FEATURES } from "@/config/features";
import { useContextualReturn } from "@/hooks/useContextualReturn";

export default function ContatoEditar() {
  const { id } = useParams<{ id: string }>();
  const { goBack } = useContextualReturn();

  const { data: contato, isLoading, error, refetch } = useQuery({
    queryKey: ["contato", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do contato não fornecido");
      
      const { data, error } = await supabase
        .from("vw_contatos_completo")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as ContatoCompleto;
    },
    enabled: !!id,
  });

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
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
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
              onClick={goBack}
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Editar Contato: {contato.nome_fantasia}</h1>
        </div>

        {FEATURES.CONTATOS_V2 ? (
          <ContatosTabs 
            contato={contato}
            onUpdate={handleUpdate}
            isEditing={true}
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Sistema de contatos V2 não habilitado
          </div>
        )}
      </div>
    </AppLayout>
  );
}