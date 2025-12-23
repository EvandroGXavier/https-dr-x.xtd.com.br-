import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPhone } from "@/lib/formatters";
import { UserPlus } from "lucide-react";

export function GlobalContactHotkey() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Alt + F12
      if (e.ctrlKey && e.altKey && e.key === 'F12') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setNome("");
    setEmail("");
    setCelular("");
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do contato",
      });
      return;
    }

    if (!celular.trim()) {
      toast({
        variant: "destructive",
        title: "Celular obrigatório",
        description: "Preencha o celular do contato",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário não autenticado",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('empresa_id, filial_id')
        .eq('user_id', authUser?.id)
        .single();

      if (!userProfile?.empresa_id || !userProfile?.filial_id) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Configuração SaaS incompleta",
        });
        return;
      }

      const { data: contato, error } = await supabase
        .from('contatos_v2')
        .insert([{
          user_id: user.id,
          tenant_id: user.id,
          empresa_id: userProfile.empresa_id,
          filial_id: userProfile.filial_id,
          nome_fantasia: nome.trim(),
        }])
        .select()
        .single();

      if (error) throw error;

      // Criar meio de contato
      const meiosContato = [];
      
      if (email.trim()) {
        meiosContato.push({
          contato_id: contato.id,
          tenant_id: user.id,
          empresa_id: userProfile.empresa_id,
          filial_id: userProfile.filial_id,
          tipo: 'Email',
          valor: email.trim(),
          principal: true,
        });
      }
      
      if (celular.trim()) {
        meiosContato.push({
          contato_id: contato.id,
          tenant_id: user.id,
          empresa_id: userProfile.empresa_id,
          filial_id: userProfile.filial_id,
          tipo: 'Celular',
          valor: celular.trim(),
          principal: true,
        });
      }

      if (meiosContato.length > 0) {
        await supabase.from('contato_meios_contato').insert(meiosContato);
      }

      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso",
      });

      // Disparar evento para atualizar listas de contatos
      window.dispatchEvent(new Event('refresh-contatos'));

      handleClose();
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar contato",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Contato Rápido
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              placeholder="Nome do contato"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="celular">Celular *</Label>
            <Input
              id="celular"
              placeholder="(11) 99999-9999"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              onBlur={(e) => setCelular(formatPhone(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSalvar}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center border-t pt-2">
          Atalho: <kbd className="px-1.5 py-0.5 rounded bg-muted">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted">Alt</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-muted">F12</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
