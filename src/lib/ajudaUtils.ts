import { AjudaConteudo } from '@/hooks/useAjuda';

// Sanitização básica para prevenir XSS
export const sanitizeHtml = (html: string): string => {
  // Remove script tags e outros elementos perigosos
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validação da estrutura do JSON da ajuda
export const validateAjudaContent = (content: any): boolean => {
  try {
    // Verificações básicas de estrutura
    if (!content || typeof content !== 'object') return false;
    if (!content.categorias || !Array.isArray(content.categorias)) return false;
    
    // Verificar cada categoria
    for (const categoria of content.categorias) {
      if (!categoria.id || !categoria.titulo || !categoria.topicos) return false;
      if (!Array.isArray(categoria.topicos)) return false;
      
      // Verificar cada tópico
      for (const topico of categoria.topicos) {
        if (!topico.slug || !topico.titulo || !topico.sumario) return false;
        if (!topico.passos_markdown || !Array.isArray(topico.passos_markdown)) return false;
        if (!topico.tags || !Array.isArray(topico.tags)) return false;
        if (!topico.aliases || !Array.isArray(topico.aliases)) return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro na validação do conteúdo da ajuda:', error);
    return false;
  }
};

// Limitar tamanho do conteúdo para evitar payload muito grande
export const validateContentSize = (content: string, maxSizeKb: number = 500): boolean => {
  const sizeKb = new Blob([content]).size / 1024;
  return sizeKb <= maxSizeKb;
};

// Extrair texto limpo para busca
export const extractSearchableText = (content: AjudaConteudo): string => {
  const texts: string[] = [];
  
  content.categorias.forEach(categoria => {
    texts.push(categoria.titulo);
    categoria.topicos.forEach(topico => {
      texts.push(topico.titulo);
      texts.push(topico.sumario);
      texts.push(...topico.tags);
      texts.push(...topico.passos_markdown);
    });
  });
  
  return texts.join(' ').toLowerCase();
};

// Gerar sugestões de busca baseadas no conteúdo
export const generateSearchSuggestions = (content: AjudaConteudo): string[] => {
  const suggestions = new Set<string>();
  
  content.categorias.forEach(categoria => {
    categoria.topicos.forEach(topico => {
      // Adicionar tags como sugestões
      topico.tags.forEach(tag => suggestions.add(tag));
      
      // Adicionar palavras-chave do título
      const titleWords = topico.titulo.toLowerCase().split(' ');
      titleWords.forEach(word => {
        if (word.length > 3) suggestions.add(word);
      });
    });
  });
  
  return Array.from(suggestions).slice(0, 20); // Limitar a 20 sugestões
};

// Mapear rota para categoria provável
export const mapRouteToCategory = (route: string): string | null => {
  const routeMapping: Record<string, string> = {
    '/contatos': 'contatos',
    '/processos': 'processos',
    '/financeiro': 'financeiro',
    '/etiquetas': 'etiquetas',
    '/biblioteca': 'biblioteca',
    '/agenda': 'agenda',
    '/documentos': 'documentos',
    '/whatsapp': 'whatsapp',
    '/emails': 'emails'
  };
  
  // Buscar match exato primeiro
  if (routeMapping[route]) return routeMapping[route];
  
  // Buscar por prefixo
  for (const [routePrefix, category] of Object.entries(routeMapping)) {
    if (route.startsWith(routePrefix)) return category;
  }
  
  return null;
};

// Cache simples em memória para conteúdo da ajuda
class AjudaCache {
  private cache: Map<string, { content: AjudaConteudo; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, content: AjudaConteudo): void {
    this.cache.set(key, {
      content,
      timestamp: Date.now()
    });
  }

  get(key: string): AjudaConteudo | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar se expirou
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.content;
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const ajudaCache = new AjudaCache();