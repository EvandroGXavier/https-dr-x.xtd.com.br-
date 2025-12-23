import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ContatoData } from "@/lib/contactUtils";

export interface Ticket {
  id: string;
  status: 'pending' | 'open' | 'closed' | 'resolving';
  ultimo_mensagem: string | null;
  contato_id: string | null;
  nao_lidas: number;
  updated_at: string;
  fila_id: string | null;
  contato?: ContatoData; 
}

export interface Message {
  id: string;
  body: string;
  from_me: boolean;
  created_at: string;
  media_url?: string | null;
  media_type?: string | null;
  atendimento_id: string;
}

export function useAtendimento(selectedTicketId?: string | null) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, profile, session } = useAuth();
  
  // Ref para controlar subscrições e evitar duplicidade
  const channelRef = useRef<any>(null);

  // 1. BUSCAR TICKETS (KANBAN)
  const fetchTickets = useCallback(async () => {
    if (!profile?.empresa_id) {
      if (session === null) setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("atendimentos")
        .select(`
          *,
          contato:contatos_v2 (
            nome_fantasia,
            contato_meios_contato (
              tipo,
              valor
            )
          )
        `)
        .eq('tenant_id', profile.empresa_id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTickets(data as any);
    } catch (error) {
      console.error("Erro ao buscar tickets:", error);
      toast({ title: "Erro de conexão", description: "Não foi possível carregar a lista de atendimentos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [profile?.empresa_id, session, toast]);

  // Realtime Global (Lista de Tickets)
  useEffect(() => {
    fetchTickets();
    const channel = supabase.channel("global_tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "atendimentos" }, () => {
        console.log("⚡ Mudança detectada em atendimentos, recarregando...");
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  // 2. BUSCAR MENSAGENS (CHAT ATIVO)
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]);
      return;
    }

    // Carregamento Inicial
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("atendimento_mensagens")
        .select("*")
        .eq("atendimento_id", selectedTicketId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    // Configuração Realtime Específica para este Chat
    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase.channel(`chat_${selectedTicketId}`)
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "atendimento_mensagens",
          filter: `atendimento_id=eq.${selectedTicketId}`
        }, 
        (payload) => {
          console.log("⚡ Nova mensagem recebida via Realtime:", payload);
          const newMsg = payload.new as Message;
          // Adiciona apenas se não já tivermos ela (evita duplicação com optimistic UI)
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { 
      if (channelRef.current) supabase.removeChannel(channelRef.current); 
    };
  }, [selectedTicketId]);

  // 3. ENVIAR MENSAGEM (Com Optimistic UI)
  const sendMessage = async (text: string) => {
    if (!selectedTicketId || !profile?.empresa_id) {
      toast({ title: "Erro de Sessão", description: "Recarregue a página.", variant: "destructive" });
      return;
    }

    // A. UI Otimista (Aparece na hora)
    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: tempId,
      body: text,
      from_me: true,
      created_at: new Date().toISOString(),
      atendimento_id: selectedTicketId
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      console.log("📤 Enviando msg:", { ticket: selectedTicketId, text });

      // B. Envio Real
      const { data: msgData, error: msgError } = await supabase
        .from("atendimento_mensagens")
        .insert({
          atendimento_id: selectedTicketId,
          tenant_id: profile.empresa_id,
          body: text,
          from_me: true,
          media_type: 'chat'
        })
        .select()
        .single();

      if (msgError) {
        console.error("❌ Erro ao gravar mensagem:", msgError);
        throw new Error(`Erro ao salvar: ${msgError.message}`);
      }

      console.log("✅ Mensagem salva:", msgData);

      // C. Atualiza Kanban
      const { error: ticketError } = await supabase
        .from("atendimentos")
        .update({ 
          updated_at: new Date().toISOString(), 
          ultimo_mensagem: text,
          status: 'open'
        })
        .eq("id", selectedTicketId);
        
      if (ticketError) console.warn("⚠️ Erro ao atualizar Kanban:", ticketError);

    } catch (err: any) {
      console.error("💥 Exceção no envio:", err);
      toast({ title: "Não foi possível enviar", description: err.message, variant: "destructive" });
      // Remove a mensagem otimista em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // 4. MOVER CARD (Drag and Drop Logic)
  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    // Atualização Otimista Local
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any, updated_at: new Date().toISOString() } : t));

    // Persistência
    const { error } = await supabase
      .from("atendimentos")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    
    if (error) {
      console.error("Erro ao mover:", error);
      toast({ title: "Erro ao mover", variant: "destructive" });
      fetchTickets(); // Reverte em caso de erro
    }
  };

  // 5. CREATE TICKET
  const createTicket = async (contatoId: string) => {
    if (!profile?.empresa_id) {
      toast({ title: "Erro de Permissão", description: "Perfil da empresa não carregado.", variant: "destructive" });
      return null;
    }
    
    if (!user?.id) {
      toast({ title: "Erro de Sessão", description: "Usuário não autenticado.", variant: "destructive" });
      return null;
    }

    try {
      console.log("Tentando criar ticket para:", { contatoId, tenant: profile.empresa_id });

      // Verifica se já existe ticket ABERTO (exceto closed)
      const { data: existing, error: searchError } = await supabase
        .from('atendimentos')
        .select('id')
        .eq('tenant_id', profile.empresa_id)
        .eq('contato_id', contatoId)
        .neq('status', 'closed')
        .maybeSingle();

      if (searchError) {
        console.error("Erro ao buscar existente:", searchError);
      }

      if (existing) {
        toast({ title: "Atendimento retomado", description: "Já existe uma conversa aberta com este contato." });
        return existing.id;
      }

      // Cria novo ticket
      const newTicketPayload = {
        tenant_id: profile.empresa_id,
        contato_id: contatoId,
        usuario_id: user.id,
        status: 'open',
        nao_lidas: 0,
        origem: 'manual',
        ultimo_mensagem: 'Atendimento iniciado manualmente'
      };

      const { data, error } = await supabase
        .from('atendimentos')
        .insert(newTicketPayload)
        .select()
        .single();

      if (error) {
        console.error("ERRO FATAL AO CRIAR TICKET:", error);
        throw error;
      }
      
      toast({ title: "Sucesso", description: "Novo atendimento iniciado." });
      
      // Atualiza a lista imediatamente
      await fetchTickets(); 
      
      return data.id;

    } catch (err: any) {
      console.error("Exceção na criação:", err);
      const msg = err.message || "Erro desconhecido";
      const details = err.details || "";
      toast({ 
        title: "Erro ao criar atendimento", 
        description: `${msg} ${details}`, 
        variant: "destructive" 
      });
      return null;
    }
  };

  return { tickets, messages, loading, sendMessage, updateTicketStatus, createTicket, refetch: fetchTickets };
}
