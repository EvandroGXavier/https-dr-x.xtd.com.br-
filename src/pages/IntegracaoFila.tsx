import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, Filter, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useIntegracao } from "@/hooks/useIntegracao";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FEATURES } from '@/config/features';

export default function IntegracaoFila() {
  const { user } = useAuth();
  const { jobs, fetchJobs, loading } = useIntegracao();
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = [...jobs];

    if (filtroStatus) {
      filtered = filtered.filter(job => job.status === filtroStatus);
    }

    if (filtroTipo) {
      filtered = filtered.filter(job => job.tipo === filtroTipo);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.ultimo_erro && job.ultimo_erro.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, filtroStatus, filtroTipo, searchTerm]);

  if (!FEATURES.INTEGRACAO_JUDICIAL_V1) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h1>
          <p className="text-muted-foreground">
            A fila de jobs de integração ainda não está disponível.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleReprocessar = async (jobId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('integracao_jobs')
        .update({
          status: 'PENDENTE',
          tentativas: 0,
          ultimo_erro: null,
          agendado_para: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Job reagendado para reprocessamento!"
      });

      fetchJobs();
    } catch (error) {
      console.error('Erro ao reprocessar job:', error);
      toast({
        title: "Erro",
        description: "Falha ao reprocessar job",
        variant: "destructive"
      });
    }
  };

  const handleCancelar = async (jobId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('integracao_jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id)
        .in('status', ['PENDENTE']);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Job cancelado com sucesso!"
      });

      fetchJobs();
    } catch (error) {
      console.error('Erro ao cancelar job:', error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar job",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCESSO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FALHA':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'EM_EXECUCAO':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCESSO':
        return <Badge variant="default">Sucesso</Badge>;
      case 'FALHA':
        return <Badge variant="destructive">Falha</Badge>;
      case 'EM_EXECUCAO':
        return <Badge variant="secondary">Em Execução</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fila de Jobs</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie as tarefas de integração judiciária
            </p>
          </div>
          <Button onClick={fetchJobs} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ID, tipo ou erro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_EXECUCAO">Em Execução</SelectItem>
                  <SelectItem value="SUCESSO">Sucesso</SelectItem>
                  <SelectItem value="FALHA">Falha</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="CONSULTA_DATAJUD">Consulta DataJud</SelectItem>
                  <SelectItem value="PETICIONAMENTO_PJE">Peticionamento PJe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Jobs</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobs.filter(j => j.status === 'PENDENTE').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'SUCESSO').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Falha</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {jobs.filter(j => j.status === 'FALHA').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Jobs</CardTitle>
            <CardDescription>
              Histórico completo de tarefas de integração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Agendado Para</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Último Erro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{job.tipo}</TableCell>
                    <TableCell>
                      {new Date(job.agendado_para).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.tentativas}</Badge>
                    </TableCell>
                    <TableCell>
                      {job.ultimo_erro ? (
                        <div className="max-w-xs truncate text-red-600 text-sm">
                          {job.ultimo_erro}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {job.status === 'FALHA' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReprocessar(job.id)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        {job.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelar(job.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredJobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {jobs.length === 0 
                          ? "Nenhum job encontrado"
                          : "Nenhum job corresponde aos filtros aplicados"
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}