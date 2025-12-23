import { useState } from 'react';
import { Plus, Zap, Settings, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEmails, EmailTrigger } from '@/hooks/useEmails';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useSecureForm } from '@/hooks/useSecureForm';

const EmailTriggers = () => {
  const { triggers, contas, loading, createTrigger, loadTriggers } = useEmails();
  const { modelos, loadModelos } = useBiblioteca();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    modelo_id: '',
    conta_id: '',
    ativo: true
  });

  // Carregar modelos ao abrir
  useState(() => {
    loadModelos(); // Carregar todos os modelos da biblioteca
  });

  // Filtrar apenas modelos de e-mail (todos os modelos por enquanto)
  const modelosEmail = modelos.filter(modelo => 
    modelo.titulo?.toLowerCase().includes('email') || 
    modelo.descricao?.toLowerCase().includes('email')
  );

  const { handleSecureSubmit, isSubmitting } = useSecureForm({
    rateLimitKey: 'email-trigger-form',
    onSubmit: async (data) => {
      await createTrigger(data);
      handleCloseDialog();
    }
  });

  const handleOpenDialog = () => {
    setFormData({
      nome: '',
      descricao: '',
      modelo_id: '',
      conta_id: '',
      ativo: true
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      nome: '',
      descricao: '',
      modelo_id: '',
      conta_id: '',
      ativo: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSecureSubmit(formData);
  };

  const contasAtivas = contas.filter(conta => conta.ativo);

  const tiposGatilho = [
    { value: 'cobranca', label: 'Cobrança Automática' },
    { value: 'aniversario', label: 'Aniversário de Cliente' },
    { value: 'novo_cliente', label: 'Novo Cliente Cadastrado' },
    { value: 'processo_movimento', label: 'Movimentação de Processo' },
    { value: 'vencimento', label: 'Vencimento de Título' },
    { value: 'lembrete', label: 'Lembrete Personalizado' }
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gatilhos de E-mail</h1>
          <p className="text-muted-foreground">
            Configure quando e como os e-mails automáticos serão enviados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Gatilho
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Novo Gatilho de E-mail</DialogTitle>
              <DialogDescription>
                Configure um novo gatilho automático para envio de e-mails.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Gatilho</Label>
                  <Select 
                    value={formData.nome} 
                    onValueChange={(value) => setFormData({ ...formData, nome: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposGatilho.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.label}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conta_id">Conta de Envio</Label>
                  <Select 
                    value={formData.conta_id} 
                    onValueChange={(value) => setFormData({ ...formData, conta_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {contasAtivas.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome} ({conta.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo_id">Modelo de E-mail</Label>
                <Select 
                  value={formData.modelo_id} 
                  onValueChange={(value) => setFormData({ ...formData, modelo_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo da biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelosEmail.map((modelo) => (
                      <SelectItem key={modelo.id} value={modelo.id}>
                        {modelo.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva quando este gatilho deve ser acionado..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Gatilho Ativo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.nome || !formData.conta_id || !formData.modelo_id}
                  className="flex-1"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Gatilho'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {contasAtivas.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Settings className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Configure pelo menos uma conta de e-mail ativa antes de criar gatilhos.
              </p>
              <Button variant="outline" className="mt-2" asChild>
                <a href="/emails/configuracoes">Configurar Contas</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8">Carregando gatilhos...</div>
      ) : triggers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum gatilho configurado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro gatilho para automatizar o envio de e-mails.
              </p>
              <Button onClick={handleOpenDialog} disabled={contasAtivas.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Gatilho
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      {trigger.nome}
                      <Badge variant={trigger.ativo ? "default" : "secondary"}>
                        {trigger.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{trigger.descricao}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // TODO: Implementar toggle ativo/inativo
                      }}
                    >
                      {trigger.ativo ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Conta de Envio:</span>
                    <div className="font-medium">
                      {trigger.email_conta?.nome} ({trigger.email_conta?.email})
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modelo:</span>
                    <div className="font-medium">{trigger.modelo?.titulo}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTriggers;