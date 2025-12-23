// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BibliotecaGrupo {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  ordem: number;
  empresa_id?: string;
  filial_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BibliotecaModelo {
  id: string;
  titulo: string;
  grupo_id: string;
  descricao?: string;
  formato: string;
  conteudo: string;
  placeholders_suportados: any;
  versao: number;
  publicado: boolean;
  exige_contato: boolean;
  exige_processo: boolean;
  gatilho_financeiro: boolean;
  financeiro_config?: any;
  empresa_id?: string;
  filial_id?: string;
  user_id: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  ativo: boolean;
  biblioteca_grupos?: {
    id: string;
    nome: string;
    slug: string;
  };
}

export interface DocumentoGeracao {
  id: string;
  modelo_id: string;
  documento_id?: string;
  contato_id?: string;
  processo_id?: string;
  payload_variaveis: any;
  status: string;
  empresa_id?: string;
  filial_id?: string;
  user_id: string;
  created_by: string;
  created_at: string;
}

export const useBiblioteca = () => {
  const [grupos, setGrupos] = useState<BibliotecaGrupo[]>([]);
  const [modelos, setModelos] = useState<BibliotecaModelo[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('biblioteca_grupos')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setGrupos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadModelos = async (grupoId?: string, searchTerm?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('biblioteca_modelos')
        .select(`
          *,
          biblioteca_grupos (
            id, nome, slug
          )
        `)
        .eq('ativo', true)
        .order('titulo', { ascending: true });

      if (grupoId && grupoId !== 'todos') {
        query = query.eq('grupo_id', grupoId);
      }

      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setModelos((data || []) as any);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar modelos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createModelo = async (modeloData: Partial<BibliotecaModelo>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Remove campos que não existem na tabela
      const { biblioteca_grupos, ...dataToInsert } = modeloData as any;

      const { data, error } = await supabase
        .from('biblioteca_modelos')
        .insert({
          ...dataToInsert,
          user_id: user.user.id,
          created_by: user.user.id,
          updated_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Modelo criado",
        description: "Modelo criado com sucesso!",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao criar modelo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateModelo = async (id: string, modeloData: Partial<BibliotecaModelo>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Remove campos que não existem na tabela
      const { biblioteca_grupos, ...dataToUpdate } = modeloData as any;

      const { data, error } = await supabase
        .from('biblioteca_modelos')
        .update({
          ...dataToUpdate,
          updated_by: user.user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Modelo atualizado",
        description: "Modelo atualizado com sucesso!",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar modelo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteModelo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('biblioteca_modelos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Modelo arquivado",
        description: "Modelo arquivado com sucesso!",
      });

      await loadModelos();
    } catch (error: any) {
      toast({
        title: "Erro ao arquivar modelo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const duplicateModelo = async (id: string) => {
    try {
      const { data: modelo } = await supabase
        .from('biblioteca_modelos')
        .select('*')
        .eq('id', id)
        .single();

      if (!modelo) throw new Error('Modelo não encontrado');

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const novoModelo = {
        titulo: `${modelo.titulo} (cópia)`,
        grupo_id: modelo.grupo_id,
        descricao: modelo.descricao,
        formato: modelo.formato,
        conteudo: modelo.conteudo,
        placeholders_suportados: modelo.placeholders_suportados,
        exige_contato: modelo.exige_contato,
        exige_processo: modelo.exige_processo,
        gatilho_financeiro: modelo.gatilho_financeiro,
        financeiro_config: modelo.financeiro_config,
        user_id: user.user.id,
        created_by: user.user.id,
        updated_by: user.user.id,
      };

      const { data, error } = await supabase
        .from('biblioteca_modelos')
        .insert(novoModelo)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Modelo duplicado",
        description: "Modelo duplicado com sucesso!",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao duplicar modelo",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getModelo = async (id: string): Promise<BibliotecaModelo | null> => {
    try {
      const { data, error } = await supabase
        .from('biblioteca_modelos')
        .select(`
          *,
          biblioteca_grupos (
            id, nome, slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error: any) {
      toast({
        title: "Erro ao carregar modelo",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    loadGrupos();
  }, []);

  return {
    grupos,
    modelos,
    loading,
    loadGrupos,
    loadModelos,
    createModelo,
    updateModelo,
    deleteModelo,
    duplicateModelo,
    getModelo,
  };
};