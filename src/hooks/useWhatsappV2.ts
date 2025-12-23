import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserTenant } from '@/hooks/useUserTenant';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppThread {
  id: string;
  account_id: string;
  wa_contact_id: string;
  status: string;
  status_atendimento: 'pendente' | 'aberto' | 'resolvido';
  assigned_to?: string;
  responsavel_id?: string;
  last_message_at?: string;
  last_customer_message_at?: string;
  created_at: string;
  updated_at: string;
  wa_contact?: {
    id: string;
    wa_phone_e164: string;
    wa_phone_formatted?: string;
    profile_name?: string;
  };
  contato?: {
    id: string;
    nome: string;
    telefone?: string;
  };
}

interface WhatsAppMessage {
  id: string;
  thread_id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  content: {
    type: string;
    text?: string;
    media_url?: string;
    storage_path?: string;
    mime?: string;
    file_name?: string;
    size?: number;
    duration?: number;
    caption?: string;
  };
  timestamp: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null;
  eh_nota_interna?: boolean;
  visivel_cliente?: boolean;
  quoted_message?: {
    id: string;
    body?: string;
    type: string;
    direction: 'INBOUND' | 'OUTBOUND';
  };
  created_at: string;
}

interface WhatsAppConfig {
  id?: string;
  instance_name: string;
  api_endpoint?: string;
  api_key?: string;
  ia_enabled?: boolean;
  ia_api_key?: string;
  is_active?: boolean;
}

interface QuickReply {
  id?: string;
  shortcut: string;
  message: string;
  created_at?: string;
}

export function useWhatsappV2() {
  const [threads, setThreads] = useState<WhatsAppThread[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<WhatsAppThread | null>(null);
  const { toast } = useToast();
  const { tenantId, empresaId, filialId, isLoading: tenantLoading, error: tenantError } = useUserTenant();

  // Load configuration from wa_configuracoes
  const loadConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔧 Loading WhatsApp config for user:', user.id);

      const result = await supabase
        .from('wa_configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (result.error) throw result.error;
      
      if (result.data) {
        console.log('✅ Config loaded:', result.data);
        setConfig({
          id: result.data.id,
          instance_name: result.data.instance_name,
          api_endpoint: result.data.api_endpoint,
          api_key: result.data.api_key,
          ia_enabled: result.data.ia_enabled,
          ia_api_key: result.data.ia_api_key,
          is_active: result.data.is_active
        });
      } else {
        console.log('ℹ️ No config found for user');
        setConfig(null);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  // Save configuration
  const saveConfig = async (newConfig: WhatsAppConfig) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('💾 Saving WhatsApp config for user:', user.id);

      // Check existing config by user
      const existing = await supabase
        .from('wa_configuracoes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let resultData: any = null;

      if (existing.data?.id) {
        const updateRes = await supabase
          .from('wa_configuracoes')
          .update({
            instance_name: newConfig.instance_name,
            api_endpoint: newConfig.api_endpoint,
            api_key: newConfig.api_key,
            ia_enabled: newConfig.ia_enabled ?? false,
            ia_api_key: newConfig.ia_api_key ?? null,
            is_active: newConfig.is_active ?? true,
          })
          .eq('id', existing.data.id)
          .select()
          .single();
        if (updateRes.error) throw updateRes.error;
        resultData = updateRes.data;
      } else {
        const insertRes = await supabase
          .from('wa_configuracoes')
          .insert({
            user_id: user.id,
            instance_name: newConfig.instance_name,
            api_endpoint: newConfig.api_endpoint!,
            api_key: newConfig.api_key!,
            ia_enabled: newConfig.ia_enabled ?? false,
            ia_api_key: newConfig.ia_api_key ?? null,
            is_active: newConfig.is_active ?? true,
          })
          .select()
          .single();
        if (insertRes.error) throw insertRes.error;
        resultData = insertRes.data;
      }

      console.log('✅ Config saved:', resultData);

      // Now, sync with wa_contas (best-effort)
      console.log('🔄 Syncing with wa_contas for instance:', resultData.instance_name);
      const accountResult = await supabase
        .from('wa_contas')
        .upsert({
          user_id: user.id,
          empresa_id: empresaId,
          filial_id: filialId,
          nome_instancia: resultData.instance_name,
          display_name: resultData.instance_name,
          status: resultData.is_active ? 'active' : 'inactive',
          is_active: resultData.is_active,
        }, { onConflict: 'nome_instancia' });

      if (accountResult.error) {
        console.error('❌ Error syncing to wa_contas:', accountResult.error);
        toast({ title: "Aviso", description: "Configuração salva, mas falha ao sincronizar a conta.", variant: "destructive" });
      } else {
        console.log('✅ wa_contas synced successfully.');
      }
      
      // Update local state with saved data
      setConfig({
        id: resultData.id,
        instance_name: resultData.instance_name,
        api_endpoint: resultData.api_endpoint,
        api_key: resultData.api_key,
        ia_enabled: resultData.ia_enabled,
        ia_api_key: resultData.ia_api_key,
        is_active: resultData.is_active
      });

      toast({
        title: "Configuração salva",
        description: "Configuração do WhatsApp atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração",
        variant: "destructive",
      });
      throw error; // Re-throw para o componente tratar
    } finally {
      setLoading(false);
    }
  };

  // Load conversation threads
  const loadThreads = async (status?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      console.log('📋 Loading threads for user:', user.id);
      
      const result = await supabase
        .from('wa_atendimentos')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (result.error) {
        console.error('❌ Error loading threads:', result.error);
        throw result.error;
      }

      console.log('✅ Loaded threads:', result.data?.length || 0);
      
      // Load related contact data for each thread
      const threadsWithContacts = await Promise.all((result.data || []).map(async (thread) => {
        let wa_contact = null;
        let contato = null;
        
        // Load wa_contact
        if (thread.wa_contact_id) {
          const contactResult = await supabase
            .from('wa_contacts')
            .select('id, wa_phone_e164, wa_phone_formatted, profile_name')
            .eq('id', thread.wa_contact_id)
            .single();
          wa_contact = contactResult.data;
        }
        
        // Load contato if linked via wa_contact
        if (wa_contact?.contato_id) {
          const contatoResult = await supabase
            .from('contatos_v2')
            .select('id, nome, telefone')
            .eq('id', wa_contact.contato_id)
            .single();
          contato = contatoResult.data;
        }
        
        return {
          ...thread,
          wa_contact,
          contato
        };
      }));

      setThreads(threadsWithContacts);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar conversas',
        variant: 'destructive',
      });
    }
  };

  // Load messages for a specific thread
  const loadMessages = async (threadId: string) => {
    try {
      console.log('💬 Loading messages for thread:', threadId);
      
      const result = await supabase
        .from('wa_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('timestamp', { ascending: true })
        .limit(100);

      if (result.error) throw result.error;

      console.log('✅ Loaded messages:', result.data?.length || 0);
      setMessages((result.data || []).map(msg => ({
        id: msg.id,
        thread_id: msg.thread_id || threadId,
        direction: msg.direction as 'INBOUND' | 'OUTBOUND',
        message_type: (msg.message_type || 'text') as 'text' | 'image' | 'document' | 'audio' | 'video',
        content: typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content,
        timestamp: msg.timestamp || msg.created_at,
        status: msg.status as 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null,
        eh_nota_interna: msg.eh_nota_interna || false,
        visivel_cliente: msg.visivel_cliente !== false,
        created_at: msg.created_at
      })));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar mensagens',
        variant: 'destructive',
      });
    }
  };

  // Send message using wa-send-message edge function
  const sendMessage = async (
    threadId: string, 
    messageBody: string | { type: 'text' | 'image' | 'document' | 'video' | 'audio'; text?: string; body?: string; media_url?: string; media_mime?: string; caption?: string }, 
    isInternalNote = false
  ) => {
    setLoading(true);
    try {
      console.log('📤 Sending message to thread:', threadId);
      
      // Determine if it's a simple text message or structured media message
      const isTextOnly = typeof messageBody === 'string';
      const messageType = isTextOnly ? 'text' : (messageBody.type || 'text');
      const text = isTextOnly ? messageBody : (messageBody.text || messageBody.body || messageBody.caption || '');
      
      const requestBody: any = {
        thread_id: threadId,
        type: messageType,
        text,
        eh_nota_interna: isInternalNote
      };

      // Add media fields if this is a media message
      if (!isTextOnly && (messageBody as any).media_url) {
        requestBody.media_url = (messageBody as any).media_url;
        requestBody.mime = (messageBody as any).media_mime;
        if ((messageBody as any).caption) {
          requestBody.caption = (messageBody as any).caption;
        }
      }

      console.log('📦 Request body:', requestBody);

      const result = await supabase.functions.invoke('wa-send-message', {
        body: requestBody
      });

      if (result.error) {
        console.error('❌ Send message error:', result.error);
        throw result.error;
      }

      if (!result.data?.ok) {
        throw new Error(result.data?.error || 'Falha ao enviar mensagem');
      }

      console.log('✅ Message sent successfully');

      // Reload messages to show the new one
      await loadMessages(threadId);
      
      toast({
        title: "Mensagem enviada",
        description: isInternalNote ? "Nota interna adicionada" : "Mensagem enviada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao enviar mensagem",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Create new conversation
  const createConversation = async (phoneNumber: string, initialMessage?: string) => {
    setLoading(true);
    try {
      console.log('🔄 Starting conversation creation for:', phoneNumber);
      
      // Get current user info for required fields
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Normalize phone number to E164 format (Brazilian)
      const digits = phoneNumber.replace(/\D/g, '');
      const e164Phone = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
      console.log('📱 Normalized phone:', e164Phone);

      // Get user's account from wa_contas
      let accountResult = await supabase
        .from('wa_contas')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (accountResult.error) {
        console.error('❌ Account lookup error:', accountResult.error);
        throw new Error('Erro ao buscar conta WhatsApp: ' + accountResult.error.message);
      }

      let account = accountResult.data;

      if (!account) {
        console.log('⚠️ No WhatsApp account found, checking configuration...');
        
        // Try to get from wa_configuracoes and create account
        const configResult = await supabase
          .from('wa_configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (configResult.data && configResult.data.instance_name) {
          console.log('📋 Creating account from configuration...');
          const newAccountResult = await supabase
            .from('wa_contas')
            .insert({
              user_id: user.id,
              empresa_id: empresaId,
              filial_id: filialId,
              nome_instancia: configResult.data.instance_name,
              display_name: configResult.data.instance_name,
              status: configResult.data.is_active ? 'active' : 'inactive',
              is_active: configResult.data.is_active || false
            })
            .select()
            .single();
          
          if (newAccountResult.error) {
            console.error('❌ Account creation error:', newAccountResult.error);
            throw new Error('Erro ao criar conta WhatsApp: ' + newAccountResult.error.message);
          }
          
          account = newAccountResult.data;
          console.log('✅ Account created:', account.id);
        } else {
          throw new Error('Nenhuma conta WhatsApp configurada. Configure primeiro em Configurações > WhatsApp.');
        }
      }

      console.log('📱 Using account:', account.id, account.nome_instancia);
      
      // Check if contact already exists
      const existingContactResult = await supabase
        .from('wa_contacts')
        .select('*')
        .eq('account_id', account.id)
        .eq('wa_phone_e164', e164Phone)
        .maybeSingle();

      let contactId = existingContactResult.data?.id;
      
      if (!existingContactResult.data) {
        console.log('👤 Creating new contact...');
        
        // Create new contact
        const newContactResult = await supabase
          .from('wa_contacts')
          .insert({
            user_id: user.id,
            account_id: account.id,
            wa_phone_e164: e164Phone,
            wa_phone_formatted: phoneNumber,
            profile_name: phoneNumber,
            opt_in_status: 'opted_in',
            empresa_id: empresaId || null,
            filial_id: filialId || null
          })
          .select()
          .single();

        if (newContactResult.error) {
          console.error('❌ Contact creation error:', newContactResult.error);
          throw new Error('Erro ao criar contato: ' + newContactResult.error.message);
        }
        
        contactId = newContactResult.data.id;
        console.log('✅ Contact created:', contactId);
      } else {
        console.log('👤 Using existing contact:', contactId);
      }

      // Create conversation thread
      console.log('💬 Creating conversation thread...');
      const threadResult = await supabase
        .from('wa_atendimentos')
        .insert({
          user_id: user.id,
          account_id: account.id,
          wa_contact_id: contactId,
          status: 'active',
          status_atendimento: 'aberto',
          assigned_to: user.id,
          responsavel_id: user.id,
          empresa_id: empresaId || null,
          filial_id: filialId || null
        })
        .select('*')
        .single();

      if (threadResult.error) {
        console.error('❌ Thread creation error:', threadResult.error);
        throw new Error('Erro ao criar conversa: ' + threadResult.error.message);
      }

      console.log('✅ Thread created:', threadResult.data.id);

      // Send initial message if provided
      if (initialMessage && initialMessage.trim()) {
        console.log('📤 Sending initial message...');
        try {
          await sendMessage(threadResult.data.id, initialMessage.trim());
        } catch (msgError) {
          console.warn('⚠️ Failed to send initial message:', msgError);
          // Don't fail the conversation creation if initial message fails
        }
      }

      // Reload threads to show the new conversation
      await loadThreads();
      setSelectedThread(threadResult.data);

      toast({
        title: "Conversa criada",
        description: "Nova conversa iniciada com sucesso",
      });

      return threadResult.data;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar conversa",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update thread status
  const updateThreadStatus = async (threadId: string, status: 'pendente' | 'aberto' | 'resolvido') => {
    try {
      const result = await supabase
        .from('wa_atendimentos')
        .update({ 
          status_atendimento: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);

      if (result.error) throw result.error;

      // Update local state
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, status_atendimento: status as any, updated_at: new Date().toISOString() }
          : thread
      ));

      toast({
        title: "Status atualizado",
        description: `Status da conversa alterado para ${status}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      });
    }
  };

  // Update atendimento details
  const updateAtendimento = async (threadId: string, updates: { status?: string; responsavel_id?: string | null }) => {
    try {
      const result = await supabase
        .from('wa_atendimentos')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', threadId);

      if (result.error) throw result.error;

      // Update local state
      setThreads(prev => prev.map(thread => 
        thread.id === threadId 
          ? { ...thread, ...updates, updated_at: new Date().toISOString() }
          : thread
      ));

      toast({
        title: "Atendimento atualizado",
        description: "Informações atualizadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar atendimento:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar atendimento",
        variant: "destructive",
      });
    }
  };

  // Load quick replies
  const loadQuickReplies = async () => {
    try {
      const result = await supabase
        .from('wa_respostas_rapidas')
        .select('*')
        .order('shortcut');

      if (result.error) throw result.error;
      setQuickReplies(result.data || []);
    } catch (error) {
      console.error('Erro ao carregar respostas rápidas:', error);
    }
  };

  // Save quick reply
  const saveQuickReply = async (quickReply: QuickReply) => {
    try {
      const userResult = await supabase.auth.getUser();
      const result = await supabase
        .from('wa_respostas_rapidas')
        .upsert({
          id: quickReply.id,
          user_id: userResult.data.user?.id,
          shortcut: quickReply.shortcut,
          message: quickReply.message
        });

      if (result.error) throw result.error;
      await loadQuickReplies();
      
      toast({
        title: "Resposta rápida salva",
        description: "Resposta rápida criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar resposta rápida:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar resposta rápida",
        variant: "destructive",
      });
    }
  };

  // Transcribe audio message
  const transcribeAudio = async (messageId: string) => {
    try {
      const result = await supabase.functions.invoke('transcribe-audio', {
        body: { messageId }
      });

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      throw error;
    }
  };

  // Load data when component mounts
  useEffect(() => {
    if (!tenantLoading) {
      console.log('🚀 Initializing WhatsApp');
      loadConfig();
      loadQuickReplies();
      loadThreads();
    }
  }, [tenantLoading]);

  return {
    threads,
    messages,
    config,
    quickReplies,
    loading,
    selectedThread,
    setSelectedThread,
    loadConfig,
    saveConfig,
    loadThreads,
    loadMessages,
    sendMessage,
    createConversation,
    updateThreadStatus,
    updateAtendimento,
    loadQuickReplies,
    saveQuickReply,
    transcribeAudio
  };
}