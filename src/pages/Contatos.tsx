import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContatosGrid } from "@/components/contatos/ContatosGrid";
import {
  Plus, 
  Loader2,
  User,
  Building,
  UserSearch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Simplified contact interface for listing
interface Contact {
  id: string;
  nome_fantasia: string;
  email?: string | null;
  telefone?: string | null;
  celular: string;
  cpf_cnpj?: string | null;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacao?: string | null;
  created_at: string;
  updated_at: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  user_id: string;
  tenant_id: string;
}

const Contatos = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load contacts
  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_contatos_compat')
        .select('*')
        .order('nome_fantasia');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleContactDelete = async (contactId: string) => {
    try {
      // @ts-ignore - RPC function type not yet in generated types
      const { error } = await supabase.rpc('excluir_contato_seguro', {
        p_contato_id: contactId
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: "Contato excluído com sucesso" });
      loadContacts(); // Recarrega os stats da página
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao excluir contato", 
        variant: "destructive" 
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contatos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus clientes e contatos
            </p>
          </div>
          
          <Button 
            className="gradient-primary"
            onClick={() => navigate('/contatos/novo')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Contatos</p>
                  <p className="text-2xl font-bold text-primary">{contacts.length}</p>
                </div>
                <User className="h-8 w-8 text-primary/70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pessoas Físicas</p>
                  <p className="text-2xl font-bold text-success">
                    {contacts.filter(c => {
                      const cpfCnpj = c.cpf_cnpj?.replace(/\D/g, '') || '';
                      return cpfCnpj.length === 11;
                    }).length}
                  </p>
                </div>
                <User className="h-8 w-8 text-success/70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pessoas Jurídicas</p>
                  <p className="text-2xl font-bold text-accent">
                    {contacts.filter(c => {
                      const cpfCnpj = c.cpf_cnpj?.replace(/\D/g, '') || '';
                      return cpfCnpj.length === 14;
                    }).length}
                  </p>
                </div>
                <Building className="h-8 w-8 text-accent/70" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold text-warning">
                    {contacts.filter(c => {
                      const cpfCnpj = c.cpf_cnpj?.replace(/\D/g, '') || '';
                      return cpfCnpj.length === 0;
                    }).length}
                  </p>
                </div>
                <UserSearch className="h-8 w-8 text-warning/70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid de Contatos */}
        {loading ? (
          <Card className="shadow-soft">
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <ContatosGrid 
            onContactDelete={handleContactDelete}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Contatos;
