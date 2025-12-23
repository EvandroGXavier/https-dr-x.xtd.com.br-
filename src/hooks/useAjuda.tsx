import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateAjudaContent, validateContentSize, ajudaCache } from '@/lib/ajudaUtils';

// Tipo para a estrutura de dados da ajuda
export interface AjudaTopico {
  slug: string;
  titulo: string;
  sumario: string;
  passos_markdown: string[];
  links_relacionados?: Array<{
    label: string;
    href: string;
  }>;
  tags: string[];
  aliases: string[];
}

export interface AjudaCategoria {
  id: string;
  titulo: string;
  topicos: AjudaTopico[];
}

export interface AjudaConteudo {
  versao: string;
  atualizado_em: string;
  categorias: AjudaCategoria[];
}

// JSON default como fallback
const AJUDA_DEFAULT: AjudaConteudo = {
  versao: "1.0",
  atualizado_em: "2025-08-27",
  categorias: [
    {
      id: "contatos",
      titulo: "Contatos",
      topicos: [
        {
          slug: "cadastrar-contato",
          titulo: "Cadastrar Novo Contato",
          sumario: "Campos obrigatórios, abas e etiquetas.",
          passos_markdown: [
            "Acesse **Menu → Contatos → + Novo**.",
            "Preencha **Nome** (obrigatório).",
            "Configure **Endereço, Etiquetas** conforme necessário.",
            "Salve as informações."
          ],
          links_relacionados: [{ label: "Novo Contato", href: "/contatos/novo" }],
          tags: ["contatos", "cadastro", "etiquetas"],
          aliases: ["/contatos/novo", "/contatos"]
        }
      ]
    },
    {
      id: "processos",
      titulo: "Processos",
      topicos: [
        {
          slug: "novo-processo",
          titulo: "Criar Novo Processo",
          sumario: "Como cadastrar um novo processo jurídico.",
          passos_markdown: [
            "Acesse **Menu → Processos → + Novo**.",
            "Preencha **Número do Processo** e **Cliente**.",
            "Configure **Status** e **Etiquetas**.",
            "Adicione **Partes** e **Detalhes** do processo."
          ],
          links_relacionados: [{ label: "Novo Processo", href: "/processos/novo" }],
          tags: ["processos", "cadastro", "juridico"],
          aliases: ["/processos/novo", "/processos"]
        }
      ]
    },
    {
      id: "financeiro",
      titulo: "Financeiro",
      topicos: [
        {
          slug: "nova-transacao",
          titulo: "Cadastrar Transação Financeira",
          sumario: "Como registrar receitas e despesas.",
          passos_markdown: [
            "Acesse **Menu → Financeiro → + Nova Transação**.",
            "Selecione **Tipo** (Receita ou Despesa).",
            "Preencha **Valor**, **Data** e **Descrição**.",
            "Configure **Categoria** e **Forma de Pagamento**."
          ],
          links_relacionados: [{ label: "Nova Transação", href: "/financeiro" }],
          tags: ["financeiro", "transacao", "receita", "despesa"],
          aliases: ["/financeiro"]
        }
      ]
    },
    {
      id: "etiquetas",
      titulo: "Etiquetas",
      topicos: [
        {
          slug: "gerenciar-etiquetas",
          titulo: "Gerenciar Etiquetas",
          sumario: "Como criar e organizar etiquetas para categorização.",
          passos_markdown: [
            "Acesse **Menu → Etiquetas**.",
            "Clique em **+ Nova Etiqueta**.",
            "Defina **Nome**, **Cor** e **Ícone**.",
            "Use etiquetas para categorizar contatos e processos."
          ],
          links_relacionados: [{ label: "Etiquetas", href: "/etiquetas" }],
          tags: ["etiquetas", "organizacao", "categorias"],
          aliases: ["/etiquetas"]
        }
      ]
    },
    {
      id: "biblioteca",
      titulo: "Biblioteca",
      topicos: [
        {
          slug: "modelos-documentos",
          titulo: "Modelos de Documentos",
          sumario: "Como criar e gerenciar modelos de documentos.",
          passos_markdown: [
            "Acesse **Menu → Biblioteca**.",
            "Clique em **+ Novo Modelo**.",
            "Configure **Título**, **Categoria** e **Conteúdo**.",
            "Use **Placeholders** para dados dinâmicos."
          ],
          links_relacionados: [{ label: "Biblioteca", href: "/biblioteca" }],
          tags: ["biblioteca", "modelos", "documentos"],
          aliases: ["/biblioteca", "/biblioteca/modelo/novo"]
        }
      ]
    }
  ]
};

export const useAjuda = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Buscar modelo de ajuda da biblioteca
  const { data: modeloAjuda, isLoading } = useQuery({
    queryKey: ['ajuda-modelo', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Verificar cache primeiro
      const cacheKey = `ajuda-${user.id}`;
      const cached = ajudaCache.get(cacheKey);
      if (cached) {
        return { conteudo_html: JSON.stringify(cached) } as any;
      }

      const { data, error } = await supabase
        .from('biblioteca_modelos_v2')
        .select('*')
        .eq('tenant_id', user.id)
        .eq('titulo', 'Ajuda do Sistema')
        .is('data_exclusao_logica', null)
        .order('data_atualizacao', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar modelo de ajuda:', error);
        return null;
      }

      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Processar conteúdo da ajuda
  const conteudoAjuda = useMemo((): AjudaConteudo => {
    if (!modeloAjuda?.conteudo_html) {
      return AJUDA_DEFAULT;
    }

    try {
      // Validação de tamanho do conteúdo
      if (!validateContentSize(modeloAjuda.conteudo_html)) {
        throw new Error('Conteúdo muito grande');
      }

      const conteudoParsed = JSON.parse(modeloAjuda.conteudo_html);
      
      // Validação da estrutura
      if (!validateAjudaContent(conteudoParsed)) {
        throw new Error('Estrutura do conteúdo inválida');
      }

      // Armazenar no cache se válido
      if (user?.id) {
        const cacheKey = `ajuda-${user.id}`;
        ajudaCache.set(cacheKey, conteudoParsed);
      }

      return conteudoParsed as AjudaConteudo;
    } catch (error) {
      console.error('Erro ao processar conteúdo da ajuda:', error);
      toast({
        title: "Erro no conteúdo personalizado",
        description: "Usando conteúdo padrão devido a erro na validação.",
        variant: "destructive",
      });
      return AJUDA_DEFAULT;
    }
  }, [modeloAjuda, toast, user]);

  // Buscar tópicos filtrados
  const topicosFiltrados = useMemo(() => {
    if (!searchTerm) return conteudoAjuda.categorias;

    const termo = searchTerm.toLowerCase();
    return conteudoAjuda.categorias
      .map(categoria => ({
        ...categoria,
        topicos: categoria.topicos.filter(topico =>
          topico.titulo.toLowerCase().includes(termo) ||
          topico.sumario.toLowerCase().includes(termo) ||
          topico.tags.some(tag => tag.toLowerCase().includes(termo)) ||
          topico.passos_markdown.some(passo => passo.toLowerCase().includes(termo))
        )
      }))
      .filter(categoria => categoria.topicos.length > 0);
  }, [conteudoAjuda, searchTerm]);

  // Encontrar tópico por alias
  const findTopicoByAlias = (alias: string): { categoria: string; topico: AjudaTopico } | null => {
    for (const categoria of conteudoAjuda.categorias) {
      for (const topico of categoria.topicos) {
        // Match exato
        if (topico.aliases.includes(alias)) {
          return { categoria: categoria.id, topico };
        }
        
        // Match por prefixo (ex: /processos/123 casa com /processos)
        const aliasMatch = topico.aliases.find(a => 
          alias.startsWith(a) || a.includes('[id]') && alias.match(new RegExp(a.replace(/\[id\]/g, '\\d+')))
        );
        
        if (aliasMatch) {
          return { categoria: categoria.id, topico };
        }
      }
    }
    return null;
  };

  // Navegar para tópico
  const navigateToTopic = (categoryId: string, topicSlug: string) => {
    setActiveCategory(categoryId);
    
    // Scroll para o tópico após um pequeno delay para garantir que o DOM foi atualizado
    setTimeout(() => {
      const element = document.getElementById(topicSlug);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Highlight temporário
        element.classList.add('bg-primary/10', 'rounded-lg', 'p-4', 'transition-colors');
        setTimeout(() => {
          element.classList.remove('bg-primary/10');
        }, 2000);
      }
    }, 100);
  };

  return {
    conteudoAjuda,
    topicosFiltrados,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    findTopicoByAlias,
    navigateToTopic,
    isLoading,
    isCustomContent: !!modeloAjuda?.conteudo_html
  };
};