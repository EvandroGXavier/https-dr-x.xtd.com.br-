import DOMPurify from 'dompurify';

/**
 * Sanitiza conteúdo HTML para evitar XSS em previews de documentos.
 * Uso obrigatório em qualquer renderização via dangerouslySetInnerHTML.
 * 
 * @param input - String HTML potencialmente insegura
 * @returns String HTML sanitizada
 * 
 * @example
 * ```tsx
 * import { sanitizeHTML } from "@/lib/sanitizeHTML";
 * 
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(documento.conteudo) }} />
 * ```
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitiza texto plano, removendo qualquer HTML
 * @param input - String potencialmente com HTML
 * @returns String sem tags HTML
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
