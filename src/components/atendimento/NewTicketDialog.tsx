import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getContactPhone, getContactInitials } from "@/lib/contactUtils";

interface NewTicketDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onContactSelect: (contactId: string) => void;
}

export function NewTicketDialog({ isOpen, onClose, onContactSelect }: NewTicketDialogProps) {
    const [search, setSearch] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        if (isOpen && profile?.empresa_id) {
            searchContacts("");
        }
    }, [isOpen, profile?.empresa_id]);

    const searchContacts = async (term: string) => {
        if (!profile?.empresa_id) {
            console.log("Aguardando profile.empresa_id...");
            if (isOpen) setLoading(true);
            return;
        }

        console.log("Buscando contatos com tenant_id:", profile.empresa_id, "termo:", term);
        setLoading(true);
        
        try {
            let query = supabase
                .from("contatos_v2")
                .select(`
                    id, 
                    nome_fantasia, 
                    classificacao,
                    contato_meios_contato (
                        tipo,
                        valor
                    )
                `)
                .eq("tenant_id", profile.empresa_id)
                .limit(20);

            if (term) {
                query = query.ilike("nome_fantasia", `%${term}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Erro ao buscar contatos:", error);
                setContacts([]);
            } else {
                console.log("Contatos encontrados:", data?.length || 0);
                setContacts(data || []);
            }
        } catch (err) {
            console.error("Erro inesperado:", err);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearch(term);
        const timeoutId = setTimeout(() => searchContacts(term), 300);
        return () => clearTimeout(timeoutId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Atendimento</DialogTitle>
                </DialogHeader>
                
                <div className="relative mt-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar contato..." 
                        className="pl-9"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                <ScrollArea className="h-[300px] mt-4 border rounded-md p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : contacts.length > 0 ? (
                        <div className="space-y-1">
                            {contacts.map((contact) => (
                                <Button
                                    key={contact.id}
                                    variant="ghost"
                                    className="w-full justify-start h-auto py-3 px-2"
                                    onClick={() => onContactSelect(contact.id)}
                                >
                                    <Avatar className="h-8 w-8 mr-3">
                                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                            {getContactInitials(contact.nome_fantasia)}
                                        </AvatarFallback>
                                    </Avatar>
                                     <div className="flex flex-col items-start overflow-hidden text-left">
                                        <span className="font-medium text-sm truncate w-full">{contact.nome_fantasia}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                                            {getContactPhone(contact)}
                                            {contact.classificacao && (
                                                <span className="bg-muted px-1 rounded text-[10px]">{contact.classificacao}</span>
                                            )}
                                        </span>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                            <UserPlus className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">Nenhum contato encontrado.</p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
