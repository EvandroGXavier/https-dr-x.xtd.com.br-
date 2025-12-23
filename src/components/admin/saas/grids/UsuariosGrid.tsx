import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Usuario {
  profile_id: string;
  user_id: string;
  nome: string;
  email: string;
  celular?: string;
  perfil?: string;
  sip_ramal?: string;
  sip_host?: string;
  sip_status?: string;
  empresa_id?: string;
  filial_id?: string;
  created_at: string;
}

interface UsuariosGridProps {
  onEdit: (id: string) => void;
}

export function UsuariosGrid({ onEdit }: UsuariosGridProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      
      // Buscar perfis com seus vínculos de permissão
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada profile, buscar o perfil de usuario_filial_perfis
      const usuariosComPerfil = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: perfilData } = await supabase
            .from("usuario_filial_perfis")
            .select("perfil_slug")
            .eq("user_id", profile.profile_id)
            .limit(1)
            .single();

          return {
            ...profile,
            perfil: perfilData?.perfil_slug || "usuario",
          };
        })
      );

      setUsuarios(usuariosComPerfil);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("profile_id", deleteId);

      if (error) throw error;

      toast.success("Usuário excluído com sucesso");
      loadUsuarios();
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);
      toast.error("Erro ao excluir usuário: " + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando usuários...</div>;
  }

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum usuário encontrado
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Celular</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Ramal SIP</TableHead>
              <TableHead>Status SIP</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow 
                key={usuario.profile_id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(usuario.profile_id)}
              >
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.celular || "-"}</TableCell>
                <TableCell>
                  <Badge variant={usuario.perfil === "admin" ? "default" : "secondary"}>
                    {usuario.perfil === "admin" ? "Administrador" : 
                     usuario.perfil === "colaborador" ? "Colaborador" : 
                     "Usuário"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {usuario.sip_ramal ? (
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {usuario.sip_ramal}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {usuario.sip_status ? (
                    <Badge
                      variant={
                        usuario.sip_status === "online"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {usuario.sip_status}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(usuario.created_at), "dd/MM/yyyy HH:mm")}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(usuario.profile_id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteId(usuario.profile_id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
