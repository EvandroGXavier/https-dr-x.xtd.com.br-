import { useState, useEffect } from 'react';
import { RefreshCw, Mail, AlertCircle, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmails, EmailLog } from '@/hooks/useEmails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EmailLogs = () => {
  const { logs, loading, loadLogs, reenviarEmail } = useEmails();
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadLogs({
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    loadLogs();
  };

  const handleReenviar = async (logId: string) => {
    await reenviarEmail(logId);
  };

  const handleViewDetails = (log: EmailLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'bg-green-500';
      case 'erro':
        return 'bg-red-500';
      case 'pendente':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        log.destinatario_email.toLowerCase().includes(searchTerm) ||
        log.assunto.toLowerCase().includes(searchTerm) ||
        log.contato?.nome?.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Logs de E-mail</h1>
          <p className="text-muted-foreground">
            Acompanhe o histórico de envios e status dos e-mails automáticos
          </p>
        </div>
        <Button onClick={() => loadLogs()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="E-mail, assunto ou contato..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={clearFilters}>Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'enviado').length}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-full mr-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'pendente').length}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{logs.filter(l => l.status === 'erro').length}</p>
                <p className="text-xs text-muted-foreground">Com Erro</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Envios</CardTitle>
          <CardDescription>
            {filteredLogs.length} de {logs.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                Não há registros de envio com os filtros aplicados.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Gatilho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge 
                          variant={log.status === 'enviado' ? 'default' : log.status === 'erro' ? 'destructive' : 'secondary'}
                        >
                          {log.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.destinatario_email}</div>
                        {log.contato?.nome && (
                          <div className="text-sm text-muted-foreground">{log.contato.nome}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {log.assunto}
                    </TableCell>
                    <TableCell>
                      {log.email_trigger?.nome || 'Manual'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.tentativa}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          Detalhes
                        </Button>
                        {log.status === 'erro' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReenviar(log.id)}
                          >
                            Reenviar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhes do E-mail</DialogTitle>
            <DialogDescription>
              Informações completas sobre o envio
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedLog.status)}
                    <Badge variant={selectedLog.status === 'enviado' ? 'default' : selectedLog.status === 'erro' ? 'destructive' : 'secondary'}>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Tentativas</label>
                  <div className="mt-1">{selectedLog.tentativa}</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Destinatário</label>
                <div className="mt-1">{selectedLog.destinatario_email}</div>
              </div>

              <div>
                <label className="text-sm font-medium">Assunto</label>
                <div className="mt-1">{selectedLog.assunto}</div>
              </div>

              {selectedLog.mensagem_erro && (
                <div>
                  <label className="text-sm font-medium text-red-600">Erro</label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm">
                    {selectedLog.mensagem_erro}
                  </div>
                </div>
              )}

              {selectedLog.payload && (
                <div>
                  <label className="text-sm font-medium">Payload</label>
                  <pre className="mt-1 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Fechar
                </Button>
                {selectedLog.status === 'erro' && (
                  <Button
                    onClick={() => {
                      handleReenviar(selectedLog.id);
                      setDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Reenviar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailLogs;