import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { QualificacaoParte } from "./useProcessos";

export interface ParteProcesso {
    id: string;
    processo_id: string;
    contato_id: string;
    qualificacao: QualificacaoParte;
    principal: boolean;
    observacoes?: string | null;
    tipo?: string | null;
    created_at: string;
    user_id: string;
    contatos_v2?: {
        id: string;
        nome_fantasia: string;
        cpf_cnpj?: string;
    } | null;
}

export const useProcessoPartes = (processoId: string | undefined) => {
    const queryClient = useQueryClient();

    // Busca partes com join para contatos_v2
    const { data: partes = [], isLoading } = useQuery({
        queryKey: ["processo-partes", processoId],
        queryFn: async () => {
            if (!processoId) return [];

            // Buscar partes primeiro
            const { data: partesData, error: partesError } = await supabase
                .from("processo_partes")
                .select(`
          id,
          processo_id,
          contato_id,
          qualificacao,
          principal,
          observacoes,
          tipo,
          created_at,
          user_id
        `)
                .eq("processo_id", processoId)
                .order("created_at", { ascending: false });

            if (partesError) {
                console.error("Erro ao buscar partes:", partesError);
                throw partesError;
            }

            if (!partesData || partesData.length === 0) return [];

            // Buscar contatos relacionados
            const contatoIds = partesData.map(p => p.contato_id);
            const { data: contatosData } = await supabase
                .from("contatos_v2")
                .select("id, nome_fantasia, cpf_cnpj")
                .in("id", contatoIds);

            // Mapear contatos para cada parte
            const contatosMap = new Map(contatosData?.map(c => [c.id, c]) || []);
            
            return partesData.map(parte => ({
                ...parte,
                contatos_v2: contatosMap.get(parte.contato_id) || null
            })) as ParteProcesso[];
        },
        enabled: !!processoId,
    });

    // Adicionar Parte
    const adicionarParte = useMutation({
        mutationFn: async (novaParte: {
            processo_id: string;
            contato_id: string;
            qualificacao: QualificacaoParte;
            principal: boolean;
            observacoes?: string;
        }) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const tenant_id = sessionData.session?.user?.user_metadata?.tenant_id;
            const user_id = sessionData.session?.user?.id;

            if (!user_id || !tenant_id) {
                throw new Error("Usuário não autenticado");
            }

            const { data, error } = await supabase
                .from("processo_partes")
                .insert({
                    processo_id: novaParte.processo_id,
                    contato_id: novaParte.contato_id,
                    qualificacao: novaParte.qualificacao,
                    principal: novaParte.principal,
                    observacoes: novaParte.observacoes,
                    tenant_id,
                    user_id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId] });
            toast.success("Parte adicionada com sucesso!");
        },
        onError: (err: any) => {
            console.error("Erro ao adicionar parte:", err);
            toast.error("Erro ao adicionar: " + err.message);
        },
    });

    // Remover Parte
    const removerParte = useMutation({
        mutationFn: async (parteId: string) => {
            const { error } = await supabase
                .from("processo_partes")
                .delete()
                .eq("id", parteId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId] });
            toast.success("Parte removida com sucesso!");
        },
        onError: (err: any) => {
            console.error("Erro ao remover parte:", err);
            toast.error("Erro ao remover: " + err.message);
        },
    });

    // Atualizar Parte
    const updateParte = useMutation({
        mutationFn: async ({
            id,
            updates,
        }: {
            id: string;
            updates: Partial<Pick<ParteProcesso, "qualificacao" | "principal" | "observacoes" | "tipo">>;
        }) => {
            const { data, error } = await supabase
                .from("processo_partes")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId] });
        },
        onError: (err: any) => {
            console.error("Erro ao atualizar parte:", err);
            toast.error("Erro ao atualizar: " + err.message);
        },
    });

    return {
        partes,
        isLoading,
        addParte: adicionarParte.mutateAsync,
        removeParte: removerParte.mutateAsync,
        updateParte: (id: string, updates: Partial<ParteProcesso>) => updateParte.mutateAsync({ id, updates }),
        isAdding: adicionarParte.isPending,
        isRemoving: removerParte.isPending,
        isUpdating: updateParte.isPending,
    };
};
