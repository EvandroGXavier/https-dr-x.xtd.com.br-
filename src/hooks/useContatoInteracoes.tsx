import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InteracaoContato {
  id: string;
  tipo: 'whatsapp' | 'email' | 'agenda' | 'processo' | 'documento';
  data: string;
  titulo: string;
  descricao?: string;
  metadata?: any;
  status?: string;
  prioridade?: string;
}

export function useContatoInteracoes(contatoId: string | undefined) {
  const [interacoes, setInteracoes] = useState<InteracaoContato[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadInteracoes = async () => {
    if (!contatoId) return;
    
    setLoading(true);
    try {
      const allInteracoes: InteracaoContato[] = [];

      // WhatsApp messages
      const { data: waMessages } = await supabase
        .from('wa_messages')
        .select('id, content, created_at, direction, status')
        .eq('contato_id', contatoId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (waMessages) {
        waMessages.forEach(msg => {
          const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          allInteracoes.push({
            id: msg.id,
            tipo: 'whatsapp',
            data: msg.created_at,
            titulo: msg.direction === 'incoming' ? 'Mensagem recebida' : 'Mensagem enviada',
            descricao: content,
            status: msg.status || undefined,
            metadata: { direction: msg.direction }
          });
        });
      }

      // Email logs - skip for now as table structure is different
      // Will be implemented later with correct schema

      // Agendas
      const { data: agendas } = await supabase
        .from('agendas')
        .select('id, titulo, descricao, data_inicio, status, prioridade')
        .or(`contato_responsavel_id.eq.${contatoId},contato_solicitante_id.eq.${contatoId}`)
        .order('data_inicio', { ascending: false })
        .limit(30);

      if (agendas) {
        agendas.forEach(agenda => {
          allInteracoes.push({
            id: agenda.id,
            tipo: 'agenda',
            data: agenda.data_inicio,
            titulo: agenda.titulo,
            descricao: agenda.descricao,
            status: agenda.status,
            prioridade: agenda.prioridade
          });
        });
      }

      // Processos vinculados - skip for now as relationship is complex
      // Will be implemented later with correct schema

      // Ordenar por data (mais recente primeiro)
      allInteracoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      setInteracoes(allInteracoes);
    } catch (error) {
      console.error('Erro ao carregar interações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de interações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteracoes();
  }, [contatoId]);

  return {
    interacoes,
    loading,
    reloadInteracoes: loadInteracoes
  };
}
