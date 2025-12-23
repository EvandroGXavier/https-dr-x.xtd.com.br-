import { create } from 'zustand';

type TipoPreenchimento = 'contato_pf' | 'contato_pj' | 'processo' | null;

interface PreenchimentoIAState {
  dados: Record<string, any> | null;
  tipo: TipoPreenchimento;
  setDados: (tipo: TipoPreenchimento, dados: Record<string, any>) => void;
  consumirDados: () => { tipo: TipoPreenchimento; dados: Record<string, any> } | null;
  limpar: () => void;
}

export const usePreenchimentoIAStore = create<PreenchimentoIAState>((set, get) => ({
  dados: null,
  tipo: null,
  
  setDados: (tipo, dados) => {
    set({ tipo, dados });
  },
  
  consumirDados: () => {
    const { tipo, dados } = get();
    if (!dados || !tipo) return null;
    
    // Limpa o store após o consumo para evitar reutilização
    set({ dados: null, tipo: null });
    return { tipo, dados };
  },
  
  limpar: () => {
    set({ dados: null, tipo: null });
  },
}));
