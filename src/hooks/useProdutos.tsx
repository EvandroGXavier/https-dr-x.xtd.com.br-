import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Produto {
  id?: string;
  tenant_id: string;
  status?: 'rascunho' | 'ativo' | 'inativo' | 'arquivado';
  aprovado_em?: string;
  nome: string;
  apelido?: string;
  sku?: string;
  codigo_barras?: string;
  ncm?: string;
  unidade_id?: string;
  marca_id?: string;
  categoria_id?: string;
  preco_base?: number;
  custo_reposicao?: number;
  estoque_minimo?: number;
  peso_kg?: number;
  dimensoes?: Record<string, unknown>;
  atributos?: Record<string, unknown>;
  foto_capa_url?: string;
  descricao?: string;
  criado_por?: string;
  atualizado_por?: string;
  created_at?: string;
  updated_at?: string;
  // Computed fields
  quantidade_estoque?: number;
  unidade?: { sigla: string; descricao?: string };
  marca?: { nome: string; site?: string };
  categoria?: { nome: string; path?: string };
}

export const useProdutos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          unidade:unidade_id(sigla, descricao),
          marca:marca_id(nome, site),
          categoria:categoria_id(nome, path),
          estoque_saldos(quantidade)
        `)
        .order('nome');

      if (error) throw error;
      
      return (data || []).map(produto => ({
        ...produto,
        quantidade_estoque: produto.estoque_saldos?.reduce(
          (total: number, saldo: any) => total + (saldo.quantidade || 0), 
          0
        ) || 0
      })) as Produto[];
    },
  });

  const createProdutoMutation = useMutation({
    mutationFn: async (produto: Omit<Produto, 'id' | 'tenant_id'>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuário não autenticado');
      
      const payload: any = {
        nome: produto.nome,
        // ✅ tenant_id removido - gatilho no BD insere automaticamente
        criado_por: user.id,
        atualizado_por: user.id,
      };
      
      if (produto.sku) payload.sku = produto.sku;
      if (produto.apelido) payload.apelido = produto.apelido;
      if (produto.codigo_barras) payload.codigo_barras = produto.codigo_barras;
      if (produto.ncm) payload.ncm = produto.ncm;
      if (produto.unidade_id) payload.unidade_id = produto.unidade_id;
      if (produto.marca_id) payload.marca_id = produto.marca_id;
      if (produto.categoria_id) payload.categoria_id = produto.categoria_id;
      if (produto.preco_base !== undefined) payload.preco_base = produto.preco_base;
      if (produto.custo_reposicao) payload.custo_reposicao = produto.custo_reposicao;
      if (produto.estoque_minimo) payload.estoque_minimo = produto.estoque_minimo;
      if (produto.peso_kg) payload.peso_kg = produto.peso_kg;
      if (produto.dimensoes) payload.dimensoes = produto.dimensoes;
      if (produto.atributos) payload.atributos = produto.atributos;
      if (produto.foto_capa_url) payload.foto_capa_url = produto.foto_capa_url;
      if (produto.descricao) payload.descricao = produto.descricao;
      if (produto.status) payload.status = produto.status;
      
      const { data, error } = await supabase
        .from('produtos')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({
        title: 'Sucesso',
        description: 'Produto cadastrado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cadastrar produto',
        variant: 'destructive',
      });
    },
  });

  const updateProdutoMutation = useMutation({
    mutationFn: async ({
      id,
      ...produto
    }: Partial<Produto> & { id: string }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuário não autenticado');
      
      const payload: any = {
        atualizado_por: user.id,
        updated_at: new Date().toISOString(),
      };
      
      if (produto.nome) payload.nome = produto.nome;
      if (produto.sku !== undefined) payload.sku = produto.sku;
      if (produto.apelido !== undefined) payload.apelido = produto.apelido;
      if (produto.codigo_barras !== undefined) payload.codigo_barras = produto.codigo_barras;
      if (produto.ncm !== undefined) payload.ncm = produto.ncm;
      if (produto.unidade_id !== undefined) payload.unidade_id = produto.unidade_id;
      if (produto.marca_id !== undefined) payload.marca_id = produto.marca_id;
      if (produto.categoria_id !== undefined) payload.categoria_id = produto.categoria_id;
      if (produto.preco_base !== undefined) payload.preco_base = produto.preco_base;
      if (produto.custo_reposicao !== undefined) payload.custo_reposicao = produto.custo_reposicao;
      if (produto.estoque_minimo !== undefined) payload.estoque_minimo = produto.estoque_minimo;
      if (produto.peso_kg !== undefined) payload.peso_kg = produto.peso_kg;
      if (produto.dimensoes) payload.dimensoes = produto.dimensoes;
      if (produto.atributos) payload.atributos = produto.atributos;
      if (produto.foto_capa_url !== undefined) payload.foto_capa_url = produto.foto_capa_url;
      if (produto.descricao !== undefined) payload.descricao = produto.descricao;
      if (produto.status) payload.status = produto.status;
      
      const { error } = await supabase
        .from('produtos')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar produto',
        variant: 'destructive',
      });
    },
  });

  return {
    produtos,
    isLoading,
    createProduto: createProdutoMutation.mutate,
    updateProduto: updateProdutoMutation.mutate,
    isCreating: createProdutoMutation.isPending,
    isUpdating: updateProdutoMutation.isPending,
  };
};
