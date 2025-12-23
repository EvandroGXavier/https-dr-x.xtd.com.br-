import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, RefreshCw, ExternalLink, Calendar, FileText } from "lucide-react";
import { useIntegracao, type ProcessoVinculo, type AndamentoProcessual } from "@/hooks/useIntegracao";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FEATURES } from '@/config/features';

interface ProcessoTribunalTabProps {
  processoId: string;
  numeroProcesso?: string;
  tipoProcesso?: string;
}

export function ProcessoTribunalTab({ 
  processoId, 
  numeroProcesso,
  tipoProcesso = 'EXTRAJUDICIAL' 
}: ProcessoTribunalTabProps) {
  const { user } = useAuth();
  const { tribunais, vincularProcesso, fetchAndamentos, solicitarSincronizacao, loading } = useIntegracao();
  const [vinculo, setVinculo] = useState<ProcessoVinculo | null>(null);
  const [andamentos, setAndamentos] = useState<AndamentoProcessual[]>([]);
  const [showVinculoForm, setShowVinculoForm] = useState(false);
  const [loadingAndamentos, setLoadingAndamentos] = useState(false);

  // Form fields para vinculação
  const [numeroCnj, setNumeroCnj] = useState(numeroProcesso || '');
  const [tribunalId, setTribunalId] = useState('');
  const [classeProcessual, setClasseProcessual] = useState('');
  const [orgaoJulgador, setOrgaoJulgador] = useState('');

  // Carrega vínculo existente
  useEffect(() => {
    const fetchVinculo = async () => {
      if (!user?.id || !processoId) return;

      try {
        const { data, error } = await supabase
          .from('processos_vinculos')
          .select(`
            *,
            tribunal:tribunais(*)
          `)
          .eq('processo_id', processoId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setVinculo(data);
          // Carrega andamentos se há vínculo
          setLoadingAndamentos(true);
          const andamentosData = await fetchAndamentos(data.id);
          setAndamentos(andamentosData);
          setLoadingAndamentos(false);
        }
      } catch (error) {
        console.error('Erro ao buscar vínculo:', error);
      }
    };

    fetchVinculo();
  }, [processoId, user?.id, fetchAndamentos]);

  const handleVincular = async () => {
    if (!numeroCnj || !tribunalId) {
      toast({
        title: "Erro",
        description: "Número CNJ e tribunal são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const success = await vincularProcesso(
      processoId,
      tribunalId,
      numeroCnj,
      classeProcessual || undefined,
      orgaoJulgador || undefined
    );

    if (success) {
      setShowVinculoForm(false);
      // Recarrega a página para mostrar o vínculo
      window.location.reload();
    }
  };

  const handleSincronizar = async () => {
    if (!vinculo) return;

    const success = await solicitarSincronizacao(vinculo.id);
    if (success) {
      // Aguarda um pouco e recarrega os andamentos
      setTimeout(async () => {
        setLoadingAndamentos(true);
        const andamentosData = await fetchAndamentos(vinculo.id);
        setAndamentos(andamentosData);
        setLoadingAndamentos(false);
      }, 2000);
    }
  };

  if (!FEATURES.INTEGRACAO_JUDICIAL_V1) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Módulo em Desenvolvimento</h3>
        <p className="text-muted-foreground">
          A integração judiciária ainda não está disponível.
        </p>
      </div>
    );
  }

  if (tipoProcesso !== 'JUDICIAL') {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Processo Não Judicial</h3>
        <p className="text-muted-foreground">
          Este processo não é do tipo judicial. Para habilitar a integração com tribunais,
          altere o tipo do processo para "JUDICIAL" na aba principal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!vinculo ? (
        // Formulário de vinculação
        <Card>
          <CardHeader>
            <CardTitle>Vincular Processo ao Tribunal</CardTitle>
            <CardDescription>
              Conecte este processo ao sistema judicial para sincronizar andamentos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showVinculoForm ? (
              <Button onClick={() => setShowVinculoForm(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Vincular ao Tribunal
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numero-cnj">Número CNJ *</Label>
                  <Input
                    id="numero-cnj"
                    placeholder="0000000-00.0000.0.00.0000"
                    value={numeroCnj}
                    onChange={(e) => setNumeroCnj(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tribunal">Tribunal *</Label>
                  <Select value={tribunalId} onValueChange={setTribunalId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tribunal" />
                    </SelectTrigger>
                    <SelectContent>
                      {tribunais.map((tribunal) => (
                        <SelectItem key={tribunal.id} value={tribunal.id}>
                          {tribunal.sigla} - {tribunal.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classe">Classe Processual</Label>
                  <Input
                    id="classe"
                    placeholder="Ex: Ação de Cobrança"
                    value={classeProcessual}
                    onChange={(e) => setClasseProcessual(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgao">Órgão Julgador</Label>
                  <Input
                    id="orgao"
                    placeholder="Ex: 1ª Vara Cível"
                    value={orgaoJulgador}
                    onChange={(e) => setOrgaoJulgador(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleVincular} disabled={loading}>
                    {loading ? 'Vinculando...' : 'Vincular'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowVinculoForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Informações do vínculo e andamentos
        <>
          {/* Info do vínculo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Processo Vinculado</CardTitle>
                  <CardDescription>
                    {vinculo.tribunal?.nome} ({vinculo.tribunal?.sigla})
                  </CardDescription>
                </div>
                <Button onClick={handleSincronizar} disabled={loading} size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Número CNJ:</strong>
                  <p>{vinculo.numero_cnj}</p>
                </div>
                <div>
                  <strong>Sistema:</strong>
                  <p>{vinculo.tribunal?.sistema}</p>
                </div>
                {vinculo.classe_processual && (
                  <div>
                    <strong>Classe:</strong>
                    <p>{vinculo.classe_processual}</p>
                  </div>
                )}
                {vinculo.orgao_julgador && (
                  <div>
                    <strong>Órgão:</strong>
                    <p>{vinculo.orgao_julgador}</p>
                  </div>
                )}
                <div>
                  <strong>Última Sincronização:</strong>
                  <p>
                    {vinculo.ultima_sincronizacao_em 
                      ? new Date(vinculo.ultima_sincronizacao_em).toLocaleString()
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Andamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Andamentos Processuais
              </CardTitle>
              <CardDescription>
                Timeline com os últimos movimentos do processo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAndamentos ? (
                <div className="text-center py-4">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Carregando andamentos...
                  </p>
                </div>
              ) : andamentos.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum andamento encontrado ainda.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Os andamentos serão carregados automaticamente pelo sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {andamentos.map((andamento, index) => (
                    <div key={andamento.id}>
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            !andamento.lido ? 'bg-primary' : 'bg-muted-foreground'
                          }`} />
                          {index < andamentos.length - 1 && (
                            <div className="w-px h-12 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {andamento.descricao}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {andamento.origem}
                              </Badge>
                              {!andamento.lido && (
                                <Badge variant="secondary" className="text-xs">
                                  Novo
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(andamento.data_evento).toLocaleString()}
                            {andamento.codigo_evento && (
                              <>
                                <Separator orientation="vertical" className="mx-2 h-3" />
                                Código: {andamento.codigo_evento}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}