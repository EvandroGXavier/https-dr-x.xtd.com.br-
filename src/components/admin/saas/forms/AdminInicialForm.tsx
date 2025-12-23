import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCheck, Mail } from "lucide-react";

interface AdminFormData {
  email: string;
  empresa_id: string;
  filial_id?: string;
}

export default function AdminInicialForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [filiais, setFiliais] = useState<any[]>([]);
  const [userFound, setUserFound] = useState<any>(null);
  const [formData, setFormData] = useState<AdminFormData>({
    email: '',
    empresa_id: '',
    filial_id: undefined
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (formData.empresa_id) {
      loadFiliais(formData.empresa_id);
    } else {
      setFiliais([]);
    }
  }, [formData.empresa_id]);

  const loadEmpresas = async () => {
    try {
      const { data } = await supabase
        .from('saas_empresas')
        .select('empresa_id, razao_social, nome_fantasia')
        .eq('ativa', true)
        .order('razao_social');
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadFiliais = async (empresaId: string) => {
    try {
      const { data } = await supabase
        .from('saas_filiais')
        .select('filial_id, nome')
        .eq('empresa_id', empresaId)
        .order('nome');
      setFiliais(data || []);
    } catch (error) {
      console.error('Erro ao carregar filiais:', error);
    }
  };

  const searchUser = async () => {
    if (!formData.email) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para buscar",
        variant: "destructive"
      });
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, nome, email, empresa_id, filial_id')
        .eq('email', formData.email)
        .maybeSingle();

      setUserFound(data);
      
      if (data) {
        toast({
          title: "Usuário encontrado!",
          description: `${data.nome} (${data.email})`
        });
      } else {
        toast({
          title: "Usuário não encontrado",
          description: "Este email não possui conta no sistema"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const updateUserProfile = async () => {
    if (!userFound || !formData.empresa_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          empresa_id: formData.empresa_id,
          filial_id: formData.filial_id || null
        })
        .eq('user_id', userFound.user_id);

      if (error) throw error;

      toast({
        title: "Admin vinculado com sucesso!",
        description: `${userFound.nome} agora é admin da empresa selecionada`
      });

      // Reset form
      setFormData({ email: '', empresa_id: '', filial_id: undefined });
      setUserFound(null);
    } catch (error: any) {
      toast({
        title: "Erro ao vincular admin",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!formData.email || !formData.empresa_id) return;

    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias para aceitar

      const { error } = await supabase
        .from('saas_convites')
        .insert([{
          empresa_id: formData.empresa_id,
          filial_id: formData.filial_id || null,
          email: formData.email,
          token,
          expires_at: expiresAt.toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Convite para ${formData.email} foi criado no sistema`
      });

      // Reset form
      setFormData({ email: '', empresa_id: '', filial_id: undefined });
      setUserFound(null);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Definir Admin Inicial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email do Usuário</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@empresa.com"
              />
              <Button
                type="button"
                variant="outline"
                onClick={searchUser}
                disabled={searchLoading || !formData.email}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {userFound && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-emerald-700 dark:text-emerald-300">
                  Usuário Encontrado
                </span>
              </div>
              <p className="text-sm">
                <strong>Nome:</strong> {userFound.nome}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {userFound.email}
              </p>
              {userFound.empresa_id && (
                <Badge variant="secondary" className="mt-2">
                  Já vinculado a uma empresa
                </Badge>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="empresa">Empresa</Label>
            <Select
              value={formData.empresa_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.empresa_id} value={empresa.empresa_id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filiais.length > 0 && (
            <div>
              <Label htmlFor="filial">Filial (Opcional)</Label>
              <Select
                value={formData.filial_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, filial_id: value || undefined }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma filial específica</SelectItem>
                  {filiais.map((filial) => (
                    <SelectItem key={filial.filial_id} value={filial.filial_id}>
                      {filial.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {userFound ? (
              <Button
                onClick={updateUserProfile}
                disabled={loading || !formData.empresa_id}
                className="flex-1"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {loading ? "Vinculando..." : "Vincular Admin"}
              </Button>
            ) : (
              <Button
                onClick={sendInvite}
                disabled={loading || !formData.email || !formData.empresa_id}
                variant="outline"
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : "Enviar Convite"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}