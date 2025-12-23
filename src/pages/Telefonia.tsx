import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Phone, PhoneOff, PhoneCall, PhoneIncoming, PhoneMissed } from 'lucide-react';
import { useTelefoniaSIP } from '@/hooks/useTelefoniaSIP';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Chamada {
  id: string;
  numero: string;
  direcao: string;
  status: string;
  duracao: number | null;
  iniciado_em: string;
  contato_id: string | null;
  contatos_v2?: {
    nome_fantasia: string;
  } | null;
}

export default function Telefonia() {
  const { profile } = useAuth();
  const { sipState, conectarSIP, desconectar, atenderChamada, encerrarChamada } = useTelefoniaSIP();
  const [chamadas, setChamadas] = useState<Chamada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarChamadas();
  }, []);

  const carregarChamadas = async () => {
    try {
      const { data, error } = await supabase
        .from('chamadas')
        .select(`
          *,
          contatos_v2 (
            nome_fantasia
          )
        `)
        .order('iniciado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      setChamadas(data || []);
    } catch (error) {
      console.error('Erro ao carregar chamadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarDuracao = (segundos: number | null) => {
    if (!segundos) return '-';
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'em_andamento': 'default',
      'atendida': 'secondary',
      'perdida': 'destructive',
      'encerrada': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStatusIcon = () => {
    switch (sipState.status) {
      case 'registered':
        return <Phone className="h-5 w-5 text-green-500" />;
      case 'connected':
        return <Phone className="h-5 w-5 text-blue-500" />;
      case 'connecting':
        return <Phone className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <PhoneOff className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Telefonia</h1>
          <p className="text-muted-foreground">Gerenciamento de chamadas via SIP/Asterisk</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon()}
                Status do Ramal
              </span>
              <Badge variant={sipState.status === 'registered' ? 'default' : 'secondary'}>
                {sipState.callStatus}
              </Badge>
            </CardTitle>
            <CardDescription>
              {profile?.sip_ramal ? (
                <>
                  Ramal: {profile.sip_ramal} • Host: {profile.sip_host || 'Não configurado'}
                </>
              ) : (
                'Configure seu ramal SIP no perfil para começar a usar'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {sipState.status === 'offline' || sipState.status === 'connecting' ? (
                <Button onClick={conectarSIP} disabled={!profile?.sip_ramal || sipState.status === 'connecting'}>
                  <Phone className="mr-2 h-4 w-4" />
                  Conectar ao PABX
                </Button>
              ) : (
                <Button onClick={desconectar} variant="outline">
                  <PhoneOff className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              )}
            </div>

            {sipState.currentCall && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Chamada em Andamento</p>
                      <p className="text-sm text-muted-foreground">{sipState.callStatus}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={atenderChamada} size="sm" variant="default">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Atender
                      </Button>
                      <Button onClick={encerrarChamada} size="sm" variant="destructive">
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Encerrar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Histórico de Chamadas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Chamadas</CardTitle>
            <CardDescription>Últimas 50 chamadas realizadas e recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : chamadas.length === 0 ? (
              <p className="text-center text-muted-foreground">Nenhuma chamada registrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Número/Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chamadas.map((chamada) => (
                    <TableRow key={chamada.id}>
                      <TableCell>
                        {chamada.direcao === 'entrada' ? (
                          <PhoneIncoming className="h-4 w-4 text-blue-500" />
                        ) : (
                          <PhoneMissed className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {chamada.contatos_v2?.nome_fantasia || chamada.numero}
                        {chamada.contatos_v2 && (
                          <span className="text-xs text-muted-foreground block">
                            {chamada.numero}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(chamada.status)}</TableCell>
                      <TableCell>{formatarDuracao(chamada.duracao)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(chamada.iniciado_em), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
