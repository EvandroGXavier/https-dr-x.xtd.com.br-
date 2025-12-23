import { useState, useCallback, useEffect, useRef } from 'react';
import JsSIP from 'jssip';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SIPState {
  status: 'offline' | 'connecting' | 'connected' | 'registered';
  currentCall: any | null;
  callStatus: string;
}

interface ChamadaData {
  id: string;
  numero: string;
  contato_id?: string;
  direcao: 'entrada' | 'saida';
  status: 'em_andamento' | 'atendida' | 'perdida' | 'encerrada';
}

export const useTelefoniaSIP = () => {
  const { profile } = useAuth();
  const [sipState, setSipState] = useState<SIPState>({
    status: 'offline',
    currentCall: null,
    callStatus: 'Desconectado'
  });
  
  const uaRef = useRef<any>(null);
  const currentSessionRef = useRef<any>(null);
  const currentChamadaIdRef = useRef<string | null>(null);

  const normalizarNumero = (numero: string) => {
    return numero.toString().replace(/[^0-9]/g, '');
  };

  const buscarContatoPorNumero = async (numero: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('telefonia-buscar-contato', {
        body: { telefone: numero }
      });

      if (error) {
        console.error('Erro ao buscar contato:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar contato:', error);
      return null;
    }
  };

  const criarChamada = async (numero: string, contatoId?: string, direcao: 'entrada' | 'saida' = 'saida') => {
    try {
      const { data, error } = await supabase.functions.invoke('telefonia-nova-chamada', {
        body: {
          numero,
          contato_id: contatoId,
          direcao
        }
      });

      if (error) {
        console.error('Erro ao criar chamada:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      return null;
    }
  };

  const atualizarChamada = async (id: string, status: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('telefonia-atualizar-chamada', {
        body: {
          id,
          status,
          encerrado_em: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erro ao atualizar chamada:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar chamada:', error);
      return null;
    }
  };

  const conectarSIP = useCallback(async () => {
    if (!profile?.sip_host || !profile?.sip_ramal || !profile?.sip_senha) {
      toast({
        title: "Configuração SIP ausente",
        description: "Configure seu ramal SIP no perfil antes de conectar",
        variant: "destructive"
      });
      return;
    }

    try {
      setSipState(prev => ({ ...prev, status: 'connecting', callStatus: 'Conectando...' }));

      const wsUrl = `wss://${profile.sip_host}:8089/ws`;
      const socket = new JsSIP.WebSocketInterface(wsUrl);
      const configuration: any = {
        sockets: [socket],
        uri: `sip:${profile.sip_ramal}@${profile.sip_host}`,
        authorization_user: profile.sip_ramal,
        password: profile.sip_senha,
        display_name: profile.sip_ramal,
        registrar_server: profile.sip_host,
      };
      // @ts-ignore
      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;

      ua.on('connected', () => {
        console.log('SIP conectado');
        setSipState(prev => ({ ...prev, status: 'connected', callStatus: 'Conectado' }));
      });

      ua.on('disconnected', () => {
        console.log('SIP desconectado');
        setSipState(prev => ({ ...prev, status: 'offline', callStatus: 'Desconectado' }));
      });

      ua.on('registered', () => {
        console.log('SIP registrado');
        setSipState(prev => ({ ...prev, status: 'registered', callStatus: 'Registrado' }));
        toast({
          title: "Conectado",
          description: "Ramal SIP conectado e registrado com sucesso"
        });
      });

      ua.on('newRTCSession', async (e: any) => {
        const session = e.session;
        currentSessionRef.current = session;
        
        const remoteNumber = session.remote_identity?.uri?.user || '';
        console.log('Nova chamada de:', remoteNumber);

        // Buscar contato
        const contato = await buscarContatoPorNumero(remoteNumber);
        const nomeContato = contato?.nome || remoteNumber;

        // Criar registro de chamada
        const chamada = await criarChamada(remoteNumber, contato?.contato_id, 'entrada');
        if (chamada) {
          currentChamadaIdRef.current = chamada.id;
        }

        setSipState(prev => ({ 
          ...prev, 
          currentCall: session,
          callStatus: `Chamada de ${nomeContato}` 
        }));

        toast({
          title: "Chamada recebida",
          description: `Ligação de ${nomeContato}`,
          action: (
            <div className="flex gap-2">
              <button onClick={() => atenderChamada()} className="px-3 py-1 bg-green-600 text-white rounded">
                Atender
              </button>
              <button onClick={() => encerrarChamada()} className="px-3 py-1 bg-red-600 text-white rounded">
                Recusar
              </button>
            </div>
          )
        });

        session.on('ended', () => {
          console.log('Chamada encerrada');
          if (currentChamadaIdRef.current) {
            atualizarChamada(currentChamadaIdRef.current, 'encerrada');
            currentChamadaIdRef.current = null;
          }
          setSipState(prev => ({ 
            ...prev, 
            currentCall: null,
            callStatus: 'Chamada encerrada' 
          }));
          currentSessionRef.current = null;
        });

        session.on('failed', () => {
          console.log('Chamada falhou');
          if (currentChamadaIdRef.current) {
            atualizarChamada(currentChamadaIdRef.current, 'perdida');
            currentChamadaIdRef.current = null;
          }
          setSipState(prev => ({ 
            ...prev, 
            currentCall: null,
            callStatus: 'Chamada falhou' 
          }));
          currentSessionRef.current = null;
        });
      });

      ua.start();
    } catch (error) {
      console.error('Erro ao conectar SIP:', error);
      toast({
        title: "Erro ao conectar",
        description: "Falha ao conectar ao PABX. Verifique as configurações.",
        variant: "destructive"
      });
      setSipState(prev => ({ ...prev, status: 'offline', callStatus: 'Erro na conexão' }));
    }
  }, [profile]);

  const atenderChamada = useCallback(() => {
    if (currentSessionRef.current) {
      currentSessionRef.current.answer({ mediaConstraints: { audio: true, video: false } });
      setSipState(prev => ({ ...prev, callStatus: 'Em atendimento' }));
      
      if (currentChamadaIdRef.current) {
        atualizarChamada(currentChamadaIdRef.current, 'atendida');
      }
    }
  }, []);

  const encerrarChamada = useCallback(() => {
    if (currentSessionRef.current) {
      currentSessionRef.current.terminate();
      currentSessionRef.current = null;
      
      if (currentChamadaIdRef.current) {
        atualizarChamada(currentChamadaIdRef.current, 'encerrada');
        currentChamadaIdRef.current = null;
      }
    }
    setSipState(prev => ({ ...prev, currentCall: null, callStatus: 'Desconectado' }));
  }, []);

  const ligarParaNumero = useCallback(async (numero: string, contatoId?: string) => {
    if (!uaRef.current) {
      toast({
        title: "Não conectado",
        description: "Conecte ao PABX antes de fazer uma chamada",
        variant: "destructive"
      });
      return;
    }

    try {
      const numeroNormalizado = normalizarNumero(numero);
      
      // Criar registro de chamada
      const chamada = await criarChamada(numeroNormalizado, contatoId, 'saida');
      if (chamada) {
        currentChamadaIdRef.current = chamada.id;
      }

      const uri = `sip:${numeroNormalizado}@${profile?.sip_host}`;
      const session = uaRef.current.call(uri, {
        mediaConstraints: { audio: true, video: false }
      });

      currentSessionRef.current = session;
      setSipState(prev => ({ 
        ...prev, 
        currentCall: session,
        callStatus: `Chamando ${numero}...` 
      }));

      session.on('ended', () => {
        if (currentChamadaIdRef.current) {
          atualizarChamada(currentChamadaIdRef.current, 'encerrada');
          currentChamadaIdRef.current = null;
        }
        setSipState(prev => ({ 
          ...prev, 
          currentCall: null,
          callStatus: 'Conectado' 
        }));
        currentSessionRef.current = null;
      });

      session.on('failed', () => {
        if (currentChamadaIdRef.current) {
          atualizarChamada(currentChamadaIdRef.current, 'perdida');
          currentChamadaIdRef.current = null;
        }
        setSipState(prev => ({ 
          ...prev, 
          currentCall: null,
          callStatus: 'Chamada falhou' 
        }));
        currentSessionRef.current = null;
      });

      session.on('confirmed', () => {
        if (currentChamadaIdRef.current) {
          atualizarChamada(currentChamadaIdRef.current, 'atendida');
        }
        setSipState(prev => ({ ...prev, callStatus: 'Em atendimento' }));
      });

    } catch (error) {
      console.error('Erro ao fazer chamada:', error);
      toast({
        title: "Erro ao ligar",
        description: "Não foi possível iniciar a chamada",
        variant: "destructive"
      });
    }
  }, [profile]);

  const desconectar = useCallback(() => {
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
    }
    if (currentSessionRef.current) {
      currentSessionRef.current.terminate();
      currentSessionRef.current = null;
    }
    setSipState({
      status: 'offline',
      currentCall: null,
      callStatus: 'Desconectado'
    });
  }, []);

  return {
    sipState,
    conectarSIP,
    desconectar,
    atenderChamada,
    encerrarChamada,
    ligarParaNumero,
    buscarContatoPorNumero
  };
};
