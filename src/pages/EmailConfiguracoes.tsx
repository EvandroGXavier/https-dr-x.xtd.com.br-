import { useState } from 'react';
import { Plus, Settings, TestTube, Edit, Trash, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEmails, EmailConta } from '@/hooks/useEmails';
import { useSecureForm } from '@/hooks/useSecureForm';

const EmailConfiguracoes = () => {
  const { contas, loading, createConta, updateConta, testarConta } = useEmails();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<EmailConta | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    tls_ssl: true,
    ativo: true
  });

  const { handleSecureSubmit, isSubmitting } = useSecureForm({
    rateLimitKey: 'email-conta-form',
    onSubmit: async (data) => {
      if (editingConta) {
        await updateConta(editingConta.id, data);
      } else {
        await createConta(data);
      }
      handleCloseDialog();
    }
  });

  const handleOpenDialog = (conta?: EmailConta) => {
    if (conta) {
      setEditingConta(conta);
      setFormData({
        nome: conta.nome,
        email: conta.email,
        smtp_host: conta.smtp_host,
        smtp_port: conta.smtp_port,
        smtp_user: conta.smtp_user,
        smtp_pass: '', // Não preencher senha por segurança
        tls_ssl: conta.tls_ssl,
        ativo: conta.ativo
      });
    } else {
      setEditingConta(null);
      setFormData({
        nome: '',
        email: '',
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        tls_ssl: true,
        ativo: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConta(null);
    setFormData({
      nome: '',
      email: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_pass: '',
      tls_ssl: true,
      ativo: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSecureSubmit(formData);
  };

  const handleTestar = async (contaId: string) => {
    await testarConta(contaId);
  };

  return (
    <div className="container mx-auto py-6">
      {/* Navegação do módulo */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <a href="/emails/configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/emails/triggers" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Gatilhos
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/emails/logs" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Logs
            </a>
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de E-mail</h1>
          <p className="text-muted-foreground">
            Configure suas contas SMTP para envio automático de e-mails
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? 'Editar Conta' : 'Nova Conta de E-mail'}
              </DialogTitle>
              <DialogDescription>
                Configure os dados SMTP para envio de e-mails automáticos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Conta</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Conta Principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="seu-email@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    placeholder="587"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário SMTP</Label>
                  <Input
                    id="smtp_user"
                    value={formData.smtp_user}
                    onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                    placeholder="seu-email@exemplo.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_pass">Senha SMTP</Label>
                  <Input
                    id="smtp_pass"
                    type="password"
                    value={formData.smtp_pass}
                    onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                    placeholder={editingConta ? "Deixe em branco para manter atual" : "Sua senha"}
                    required={!editingConta}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tls_ssl"
                    checked={formData.tls_ssl}
                    onCheckedChange={(checked) => setFormData({ ...formData, tls_ssl: checked })}
                  />
                  <Label htmlFor="tls_ssl">Usar TLS/SSL</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Conta Ativa</Label>
                </div>
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
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Salvando...' : (editingConta ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando contas...</div>
      ) : contas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma conta configurada</h3>
              <p className="text-muted-foreground mb-4">
                Configure sua primeira conta SMTP para começar a enviar e-mails automáticos.
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contas.map((conta) => (
            <Card key={conta.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {conta.nome}
                      <Badge variant={conta.ativo ? "default" : "secondary"}>
                        {conta.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{conta.email}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestar(conta.id)}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Testar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(conta)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Servidor:</span>
                    <div className="font-mono">{conta.smtp_host}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Porta:</span>
                    <div className="font-mono">{conta.smtp_port}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">TLS/SSL:</span>
                    <div>{conta.tls_ssl ? "Sim" : "Não"}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usuário:</span>
                    <div className="font-mono text-xs truncate">{conta.smtp_user}</div>
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

export default EmailConfiguracoes;