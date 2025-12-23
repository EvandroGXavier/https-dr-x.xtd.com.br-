/**
 * Sanitiza o nome de um arquivo removendo caracteres especiais
 * e garantindo compatibilidade com o Supabase Storage
 */
export function sanitizeFileName(fileName: string): string {
  // Remove acentos e caracteres especiais
  const sanitized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais por underscore
    .replace(/_+/g, '_') // Remove underscores duplos
    .replace(/^_+|_+$/g, ''); // Remove underscores do início e fim
  
  return sanitized;
}

/**
 * Gera um nome de arquivo único com timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const sanitizedName = sanitizeFileName(originalName);
  const timestamp = Date.now();
  
  // Separa nome e extensão
  const lastDotIndex = sanitizedName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // Sem extensão
    return `${timestamp}_${sanitizedName}`;
  }
  
  const nameWithoutExt = sanitizedName.substring(0, lastDotIndex);
  const extension = sanitizedName.substring(lastDotIndex);
  
  return `${timestamp}_${nameWithoutExt}${extension}`;
}

/**
 * Formata bytes em formato legível
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}