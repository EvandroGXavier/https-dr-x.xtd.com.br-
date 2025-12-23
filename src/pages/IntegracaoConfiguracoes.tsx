import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Plus, Settings, Shield, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import { useIntegracao } from "@/hooks/useIntegracao";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FEATURES } from '@/config/features';

export default function IntegracaoConfiguracoes() {
  const { user } = useAuth();
  const { tribunais, credenciais, fetchCredenciais, loading } = useIntegracao();
  const [showNovaCredencial, setShowNovaCredencial] = useState(false);
  const [formData, setFormData] = useState({
    tribunal_id: '',
    tipo: 'CERTIFICADO_A1',
    alias: '',
    ref_armazenamento: '',
    valido_ate: ''
  });

  if (!FEATURES.INTEGRACAO_JUDICIAL_V1) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h1>
          <p className="text-muted-foreground">
            As configurações de integração judiciária ainda não estão disponíveis.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleSalvarCredencial = async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('credenciais_tribunal')
        .insert({
          ...formData,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Credencial adicionada com sucesso!"
      });

      setShowNovaCredencial(false);
      setFormData({
        tribunal_id: '',
        tipo: 'CERTIFICADO_A1',
        alias: '',
        ref_armazenamento: '',
        valido_ate: ''
      });
      fetchCredenciais();
    } catch (error) {
      console.error('Erro ao salvar credencial:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar credencial",
        variant: "destructive"
      });
    }
  };

  const handleRemoverCredencial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('credenciais_tribunal')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Credencial removida com sucesso!"
      });

      fetchCredenciais();
    } catch (error) {
      console.error('Erro ao remover credencial:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover credencial",
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações de Integração</h1>
            <p className="text-muted-foreground">
              Gerencie credenciais e configurações dos sistemas judiciais
            </p>
          </div>
        </div>

        {/* Credenciais de Acesso */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Credenciais de Acesso
                </CardTitle>
                <CardDescription>
                  Certificados digitais e tokens para acesso aos tribunais
                </CardDescription>
              </div>
              <Dialog open={showNovaCredencial} onOpenChange={setShowNovaCredencial}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Credencial
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Credencial</DialogTitle>
                    <DialogDescription>
                      Configure uma nova credencial para acesso ao tribunal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tribunal">Tribunal</Label>
                      <Select
                        value={formData.tribunal_id}
                        onValueChange={(value) => setFormData({ ...formData, tribunal_id: value })}
                      >
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
                      <Label htmlFor="tipo">Tipo de Credencial</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CERTIFICADO_A1">Certificado A1</SelectItem>
                          <SelectItem value="CERTIFICADO_A3">Certificado A3</SelectItem>
                          <SelectItem value="TOKEN_API">Token de API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alias">Nome/Alias</Label>
                      <Input
                        id="alias"
                        placeholder="Ex: Certificado do Escritório"
                        value={formData.alias}
                        onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref">Referência Segura</Label>
                      <Input
                        id="ref"
                        placeholder="Chave de armazenamento seguro"
                        value={formData.ref_armazenamento}
                        onChange={(e) => setFormData({ ...formData, ref_armazenamento: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use Supabase Vault ou outro sistema seguro para armazenar certificados
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validade">Data de Validade</Label>
                      <Input
                        id="validade"
                        type="date"
                        value={formData.valido_ate}
                        onChange={(e) => setFormData({ ...formData, valido_ate: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowNovaCredencial(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSalvarCredencial} disabled={loading}>
                        Salvar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {credenciais.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nenhuma Credencial</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione credenciais para acessar os sistemas judiciais
                </p>
                <Button onClick={() => setShowNovaCredencial(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeira Credencial
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {credenciais.map((credencial) => (
                  <div
                    key={credencial.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{credencial.alias}</h4>
                        <Badge variant={credencial.homologado ? "default" : "secondary"}>
                          {credencial.homologado ? "Homologado" : "Pendente"}
                        </Badge>
                        <Badge variant="outline">{credencial.tipo}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {credencial.tribunal?.nome}
                      </p>
                      {credencial.valido_ate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          Válido até: {new Date(credencial.valido_ate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoverCredencial(credencial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tribunais Suportados */}
        <Card>
          <CardHeader>
            <CardTitle>Tribunais Suportados</CardTitle>
            <CardDescription>
              Sistemas judiciais disponíveis para integração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tribunais.map((tribunal) => (
                <div key={tribunal.id} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{tribunal.sigla}</h4>
                      <Badge variant={tribunal.ativo ? "default" : "secondary"}>
                        {tribunal.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tribunal.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Sistema: {tribunal.sistema}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Avisos de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              Avisos de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Certificados Digitais:</strong> Nunca armazene certificados diretamente no banco de dados. 
                Use Supabase Vault ou HSM para armazenamento seguro.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Homologação:</strong> Credenciais precisam ser homologadas pelos tribunais antes do uso em produção.
                Teste sempre em ambiente de homologação primeiro.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Validade:</strong> Monitore as datas de validade dos certificados e renove com antecedência 
                para evitar interrupções no serviço.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}