// src/lib/contactUtils.ts

export interface MeioContato {
  tipo: string | null;
  valor: string;
}

export interface ContatoData {
  nome_fantasia: string;
  contato_meios_contato?: MeioContato[];
}

/**
 * Extrai o melhor número de telefone/celular disponível.
 * Prioriza: WhatsApp > Celular > Telefone > Primeiro item encontrado.
 */
export function getContactPhone(contato?: ContatoData | null): string {
  if (!contato || !contato.contato_meios_contato || contato.contato_meios_contato.length === 0) {
    return "Sem número";
  }

  const meios = contato.contato_meios_contato;

  // 1. Tenta achar WhatsApp específico
  const whatsapp = meios.find(m => m.tipo?.toLowerCase().includes('whatsapp'));
  if (whatsapp) return whatsapp.valor;

  // 2. Tenta achar Celular
  const celular = meios.find(m => m.tipo?.toLowerCase() === 'celular');
  if (celular) return celular.valor;

  // 3. Tenta achar Telefone
  const telefone = meios.find(m => m.tipo?.toLowerCase() === 'telefone');
  if (telefone) return telefone.valor;

  // 4. Retorna o primeiro que encontrar (fallback)
  return meios[0].valor;
}

/**
 * Retorna as iniciais para o Avatar (já que não temos foto_perfil)
 */
export function getContactInitials(nome?: string): string {
  if (!nome) return "?";
  return nome.substring(0, 2).toUpperCase();
}
