import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Usuario {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  perfil_slug: string;
  ativo: boolean;
}

interface EmpresaUsuariosProps {
  empresaUuid: string;
}

export default function EmpresaUsuarios({ empresaUuid }: EmpresaUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ email: "", perfil: "Cliente" });
  const [usuarioParaRemover, setUsuarioParaRemover] = useState<Usuario | null>(null);

  useEffect(() => {
    loadUsuarios();
  }, [empresaUuid]);

  const loadUsuarios = async () => {
    if (!empresaUuid) {
      setUsuarios([]);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuario_filial_perfis')
        .select(`
          id,
          user_id,
          perfil_slug,
          ativo
        `)
        .eq('empresa_id', empresaUuid);

      if (error) throw error;

      // Buscar informações dos usuários do sistema
      const { data: todosUsuarios } = await supabase.rpc('get_usuarios_sistema');
      const usuariosComInfo = (data || []).map((vinculo) => {
        const user = (todosUsuarios || []).find((u: any) => u.id === vinculo.user_id);
        return {
          id: vinculo.id,
          user_id: vinculo.user_id,
          email: user?.email || 'N/A',
          nome: user?.nome || 'N/A',
          perfil_slug: vinculo.perfil_slug,
          ativo: vinculo.ativo
        };
      });

      setUsuarios(usuariosComInfo);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast.error("Erro ao carregar usuários da empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarUsuario = async () => {
    if (!novoUsuario.email) {
      toast.error("Informe o e-mail do usuário");
      return;
    }

    if (!empresaUuid) {
      toast.error("Empresa inválida. Reabra a aba Dados e volte para Usuários.");
      return;
    }

    try {
      setLoading(true);

      // Buscar usuário pelo email
      const { data: todosUsuariosSistema } = await supabase.rpc('get_usuarios_sistema');
      const usuario = (todosUsuariosSistema || []).find((u: any) => u.email === novoUsuario.email);

      if (!usuario) {
        toast.error(
          "Usuário não encontrado ou e-mail não confirmado. " +
          "O usuário deve: 1) Se cadastrar no sistema, 2) Confirmar o e-mail recebido na caixa de entrada."
        );
        return;
      }

      // Verificar se já está vinculado
      const jaVinculado = usuarios.some(u => u.user_id === usuario.id);
      if (jaVinculado) {
        toast.error("Este usuário já está vinculado a esta empresa");
        return;
      }

      // Buscar filial matriz
      const { data: filiais, error: filialError } = await supabase
        .from('saas_filiais' as any)
        .select('filial_id')
        .eq('empresa_id', empresaUuid)
        .eq('matriz', true)
        .limit(1)
        .single();

      if (filialError) throw filialError;

      // Vincular usuário
      const { error: vinculoError } = await supabase
        .from('usuario_filial_perfis')
        .insert({
          user_id: usuario.id,
          empresa_id: empresaUuid,
          filial_id: (filiais as any)?.filial_id,
          perfil_slug: novoUsuario.perfil,
          ativo: true,
          tenant_id: empresaUuid
        });

      if (vinculoError) throw vinculoError;

      toast.success("Usuário adicionado com sucesso!");
      setNovoUsuario({ email: "", perfil: "Cliente" });
      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast.error(error.message || "Erro ao adicionar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverUsuario = async () => {
    if (!usuarioParaRemover) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('usuario_filial_perfis')
        .delete()
        .eq('id', usuarioParaRemover.id);

      if (error) throw error;

      toast.success("Usuário removido da empresa");
      setUsuarioParaRemover(null);
      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error("Erro ao remover usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarStatus = async (usuario: Usuario) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('usuario_filial_perfis')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);

      if (error) throw error;

      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso`);
      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error("Erro ao alterar status do usuário");
    } finally {
      setLoading(false);
    }
  };

  const handleAlterarPerfil = async (usuario: Usuario, novoPerfil: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('usuario_filial_perfis')
        .update({ perfil_slug: novoPerfil })
        .eq('id', usuario.id);

      if (error) throw error;

      toast.success("Perfil alterado com sucesso");
      loadUsuarios();
    } catch (error: any) {
      console.error('Erro ao alterar perfil:', error);
      toast.error("Erro ao alterar perfil do usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-medium">Usuários da Empresa</h3>
        
        {/* Adicionar novo usuário */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email-usuario">E-mail do Usuário</Label>
            <Input
              id="email-usuario"
              type="email"
              placeholder="usuario@email.com"
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="w-40">
            <Label htmlFor="perfil-usuario">Perfil</Label>
            <Select
              value={novoUsuario.perfil}
              onValueChange={(value) => setNovoUsuario({ ...novoUsuario, perfil: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Operador">Operador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdicionarUsuario} disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de usuários */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuário vinculado a esta empresa
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Select
                        value={usuario.perfil_slug}
                        onValueChange={(value) => handleAlterarPerfil(usuario, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Cliente">Cliente</SelectItem>
                          <SelectItem value="Operador">Operador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? "default" : "secondary"}>
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlterarStatus(usuario)}
                          disabled={loading}
                        >
                          {usuario.ativo ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUsuarioParaRemover(usuario)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog de confirmação para remover */}
      <AlertDialog open={!!usuarioParaRemover} onOpenChange={() => setUsuarioParaRemover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{usuarioParaRemover?.nome}</strong> desta empresa?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoverUsuario}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
