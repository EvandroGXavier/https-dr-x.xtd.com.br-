// Função para buscar endereço pelo CEP usando ViaCEP
import { supabase } from '@/integrations/supabase/client';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export const consultarCep = async (cep: string): Promise<ViaCepResponse> => {
  const cepLimpo = cep.replace(/\D/g, '');
  
  if (cepLimpo.length !== 8) {
    throw new Error('CEP deve ter 8 dígitos');
  }

  const cepFormatado = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  
  try {
    console.log(`[ViaCEP] Consultando CEP: ${cepFormatado}`);
    
    // Usar edge function do Supabase para consultar CEP
    const { data, error } = await supabase.functions.invoke('consultar-cep', {
      body: { cep: cepLimpo }
    });
    
    if (error) {
      console.error('[ViaCEP] Erro na edge function:', error);
      throw new Error(error.message || 'Erro ao consultar CEP');
    }
    
    if (!data) {
      throw new Error('Nenhum dado retornado da consulta de CEP');
    }
    
    console.log(`[ViaCEP] CEP encontrado:`, data);
    return data;
  } catch (error) {
    console.error(`[ViaCEP] Erro ao consultar CEP ${cepFormatado}:`, error);
    throw error;
  }
};

export const formatarCep = (cep: string): string => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length <= 5) {
    return cepLimpo;
  }
  return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;
};