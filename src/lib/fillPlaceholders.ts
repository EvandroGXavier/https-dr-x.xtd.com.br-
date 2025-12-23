/**
 * Substitui placeholders no formato {{campo}} ou {{objeto.campo}} com dados reais
 */
export function fillPlaceholders(template: string, data: any): string {
  if (!template || !data) return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split(".");
    let value = data;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return match; // Mantém o placeholder se não encontrar o valor
      }
    }

    // Formatar datas, números, etc.
    if (value instanceof Date) {
      return value.toLocaleDateString("pt-BR");
    }

    if (typeof value === "number") {
      return value.toString();
    }

    return value != null ? String(value) : match;
  });
}
