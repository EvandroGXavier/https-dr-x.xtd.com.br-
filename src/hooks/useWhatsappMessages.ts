import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsappMessage {
  id: string;
  thread_id: string | null;
  user_id: string | null;
  contato_id: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: 'text' | 'audio' | 'image' | 'document' | 'video';
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null;
  content: {
    type: string;
    text?: string;
    media_url?: string;
    mime?: string;
    file_name?: string;
    size?: number;
    duration?: number;
    caption?: string;
    raw_meta?: any;
  };
  timestamp: string;
  wa_message_id: string | null;
}

export function useWhatsappMessages(contatoId: string | null) {
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar mensagens via thread
  const loadMessages = async () => {
    if (!contatoId) return;

    setLoading(true);
    setError(null);
    try {
      // Buscar thread ativo do contato
      const { data: contactData } = await supabase
        .from("wa_contacts")
        .select("id")
        .eq("contato_id", contatoId)
        .single();

      if (!contactData) {
        setMessages([]);
        return;
      }

      const { data: threadData } = await supabase
        .from("wa_atendimentos")
        .select("id")
        .eq("wa_contact_id", contactData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!threadData) {
        setMessages([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("wa_messages")
        .select("id, thread_id, user_id, contato_id, direction, message_type, status, content, timestamp, wa_message_id")
        .eq("thread_id", threadData.id)
        .order("timestamp", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages((data || []) as WhatsappMessage[]);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
      setError("Não foi possível carregar as mensagens");
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async (messageBody: string, numero: string): Promise<{ success: boolean; error?: string }> => {
    if (!contatoId || !messageBody.trim()) {
      return { success: false, error: "Mensagem vazia" };
    }

    setSending(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: "Usuário não autenticado" };
      }

      // Buscar conta WhatsApp do usuário
      const { data: accountData } = await supabase
        .from("wa_contas")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!accountData) {
        return { success: false, error: "Nenhuma conta WhatsApp configurada" };
      }

      // Buscar ou criar wa_contact
      let { data: contactData } = await supabase
        .from("wa_contacts")
        .select("id")
        .eq("contato_id", contatoId)
        .single();

      if (!contactData) {
        const { data: newContact, error: contactError } = await supabase
          .from("wa_contacts")
          .insert({
            user_id: user.id,
            account_id: accountData.id,
            contato_id: contatoId,
            wa_phone_e164: numero.replace(/\D/g, ""),
          })
          .select()
          .single();

        if (contactError) {
          return { success: false, error: contactError.message };
        }
        contactData = newContact;
      }

      // Buscar ou criar thread
      let { data: threadData } = await supabase
        .from("wa_atendimentos")
        .select("id")
        .eq("wa_contact_id", contactData.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!threadData) {
        const { data: newThread, error: threadError } = await supabase
          .from("wa_atendimentos")
          .insert({
            user_id: user.id,
            account_id: accountData.id,
            wa_contact_id: contactData.id,
            status: "pendente",
          })
          .select()
          .single();

        if (threadError) {
          return { success: false, error: threadError.message };
        }
        threadData = newThread;
      }

      // Inserir mensagem com status queued
      const { error: insertError } = await supabase.from("wa_messages").insert({
        user_id: user.id,
        thread_id: threadData.id,
        contato_id: contatoId,
        direction: "OUTBOUND",
        message_type: "text",
        status: "QUEUED",
        content: { type: "text", text: messageBody.trim() },
        timestamp: new Date().toISOString(),
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      setTimeout(() => {
        loadMessages();
      }, 1000);

      return { success: true };
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contatoId]);

  // Real-time subscription for message updates (INSERT and UPDATE)
  useEffect(() => {
    if (!contatoId) return;

    const channel = supabase
      .channel(`whatsapp_messages:${contatoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wa_messages",
        },
        (payload) => {
          console.log("📨 Nova mensagem recebida:", payload);
          const newMsg = payload.new as any;
          
          if (newMsg) {
            setMessages((prev) => {
              // Evitar duplicatas
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg as WhatsappMessage];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "wa_messages",
        },
        (payload) => {
          console.log("🔄 Mensagem atualizada:", payload);
          const updatedMsg = payload.new as any;
          
          if (updatedMsg) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === updatedMsg.id ? (updatedMsg as WhatsappMessage) : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [contatoId]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    reloadMessages: loadMessages,
  };
}
