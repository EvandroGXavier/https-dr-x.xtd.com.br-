import { useState, useEffect, startTransition, useMemo, useRef } from 'react';
import { useWhatsappV2 } from '@/hooks/useWhatsappV2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Send, User, Phone, Plus, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { useUserTenant } from '@/hooks/useUserTenant';
import { ChatHeader } from '@/components/whatsapp/ChatHeader';
import { ChatInfoPanel } from '@/components/whatsapp/ChatInfoPanel';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatMessage } from '@/components/whatsapp/ChatMessage';
import { MessageComposer, MessageComposerHandle } from '@/components/whatsapp/MessageComposer';
import { ShortcutsPanel } from '@/components/whatsapp/ShortcutsPanel';

interface Contact {
  id: string;
  nome_fantasia?: string;
  nome?: string;
  celular?: string;
  telefone?: string;
}

interface SystemUser {
  id: string;
  nome: string;
  email: string;
}

export default function WhatsAppV2() {
  const {
    threads,
    messages,
    loading,
    selectedThread,
    setSelectedThread,
    loadThreads,
    loadMessages,
    sendMessage,
    createConversation,
    updateThreadStatus,
    updateAtendimento,
  } = useWhatsappV2();

  const { tenantId, isLoading: tenantLoading, error: tenantError } = useUserTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [newConversationPhone, setNewConversationPhone] = useState('');
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const messageComposerRef = useRef<MessageComposerHandle>(null);

  useEffect(() => {
    startTransition(() => {
      loadThreads();
      loadContacts();
      loadSystemUsers();
    });
  }, []);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
      // Auto-focus no compositor de mensagens
      setTimeout(() => {
        messageComposerRef.current?.focus();
      }, 100);
    }
  }, [selectedThread]);

  // Load contacts from database
  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_contatos_compat')
        .select('id, nome_fantasia, celular, email')
        .order('nome_fantasia');
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Load system users for assignee selection
  const loadSystemUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .not('nome', 'is', null)
        .order('nome');
      
      if (error) throw error;
      setSystemUsers((data || []).map(user => ({
        id: user.user_id,
        nome: user.nome || user.email,
        email: user.email
      })));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const searchLower = contactSearchTerm.toLowerCase();
    return (
      contact.nome?.toLowerCase().includes(searchLower) ||
      contact.nome_fantasia?.toLowerCase().includes(searchLower) ||
      contact.celular?.includes(contactSearchTerm) ||
      contact.telefone?.includes(contactSearchTerm)
    );
  });

  // Handle creating new conversation
  const handleCreateConversation = async () => {
    if (!newConversationPhone) return;
    
    if (!tenantId) {
      return; // TenantBranchSelector will handle showing the proper message
    }
    
    try {
      await createConversation(newConversationPhone, newConversationMessage);
      setShowNewConversationDialog(false);
      setNewConversationPhone('');
      setNewConversationMessage('');
      setSelectedContact(null);
      setContactSearchTerm('');
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setNewConversationPhone(contact.celular || contact.telefone || '');
    setContactSearchTerm('');
  };

  // Filter threads based on search, status, and assignee
  const filteredThreads = threads.filter(thread => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      thread.wa_contact?.profile_name?.toLowerCase().includes(searchLower) ||
      thread.wa_contact?.wa_phone_formatted?.includes(searchTerm);
    
    const matchesStatus = statusFilter ? thread.status === statusFilter : true;
    
    const matchesAssignee = assigneeFilter 
      ? assigneeFilter === 'unassigned' 
        ? !thread.responsavel_id 
        : thread.responsavel_id === assigneeFilter
      : true;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'aberto': return 'default';
      case 'pendente': return 'secondary';
      case 'resolvido': return 'outline';
      default: return 'outline';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberto': return 'Aberto';
      case 'pendente': return 'Pendente';
      case 'resolvido': return 'Resolvido';
      default: return status;
    }
  };

  // Get assignee name
  const getAssigneeName = (responsavelId?: string) => {
    if (!responsavelId) return 'Não atribuído';
    const user = systemUsers.find(u => u.id === responsavelId);
    return user?.nome || 'Usuário não encontrado';
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) return;
    
    try {
      await sendMessage(selectedThread.id, newMessage, isInternalNote);
      setNewMessage('');
      setIsInternalNote(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedThread) return;
    
    try {
      await updateAtendimento(selectedThread.id, { status: newStatus as any });
      await loadThreads(); // Refresh threads
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Handle assignee change
  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!selectedThread) return;
    
    try {
      await updateAtendimento(selectedThread.id, { 
        responsavel_id: newAssigneeId === 'unassigned' ? null : newAssigneeId 
      });
      await loadThreads(); // Refresh threads
    } catch (error) {
      console.error('Erro ao atribuir responsável:', error);
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleInfoPanel = () => {
    setIsInfoPanelOpen(!isInfoPanelOpen);
  };

  const layout = useMemo(() => {
    return isInfoPanelOpen ? [10, 20, 45, 25] : [10, 20, 70, 0];
  }, [isInfoPanelOpen]);

  // Prepare threads for ConversationList
  const mappedThreads = filteredThreads.map(thread => ({
    id: thread.id,
    name: thread.wa_contact?.profile_name || `WhatsApp ${thread.wa_contact?.wa_phone_formatted}`,
    profilePictureUrl: undefined,
    lastMessageAt: thread.last_message_at || new Date().toISOString(),
  }));

  // Prepare instances (mock for now)
  const instances = [{ id: 'default', name: 'Instância Principal' }];

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        {/* Se está carregando os dados do tenant, mostrar loading */}
        {tenantLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp - Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Carregando dados da empresa...</p>
            </CardContent>
          </Card>
        ) : /* Se há erro ou não há tenant, mostrar mensagem */
        tenantError || !tenantId ? (
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp - Conversas</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{tenantError || 'Usuário não possui empresa atribuída. Entre em contato com o administrador.'}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <ResizablePanelGroup
              direction="horizontal"
              className="h-[calc(100vh-8rem)] items-stretch"
              onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`
              }}
            >
              {/* Painel de Atalhos Fixo */}
              <ResizablePanel defaultSize={layout[0]} minSize={8} maxSize={15}>
                <ShortcutsPanel />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Lista de Conversas */}
              <ResizablePanel defaultSize={layout[1]} minSize={15} maxSize={30}>
                <ConversationList
                  instances={instances}
                  selectedInstanceId="default"
                  onInstanceChange={() => {}}
                  threads={mappedThreads}
                  selectedThreadId={selectedThread?.id}
                  onThreadSelect={(id) => {
                    const thread = threads.find(t => t.id === id);
                    if (thread) setSelectedThread(thread);
                  }}
                />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Chat Principal */}
              <ResizablePanel defaultSize={layout[2]} className="flex flex-col">
                {selectedThread ? (
                  <>
                    {/* Header fixo */}
                    <ChatHeader
                      contactName={selectedThread.wa_contact?.profile_name || `WhatsApp ${selectedThread.wa_contact?.wa_phone_formatted}`}
                      contactImage={undefined}
                      onToggleInfoPanel={toggleInfoPanel}
                    />

                    {/* Mensagens com scroll independente */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <ChatMessage
                            key={message.id || index}
                            message={message}
                          />
                        ))}
                        {messages.length === 0 && (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Nenhuma mensagem ainda</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compositor fixo */}
                    <MessageComposer
                      ref={messageComposerRef}
                      onSendMessage={async (msg) => {
                        if (msg.body || msg.media_url) {
                          await sendMessage(selectedThread.id, msg, isInternalNote)
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Selecione uma conversa para começar</p>
                  </div>
                )}
              </ResizablePanel>

              {isInfoPanelOpen && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={layout[3]} minSize={20} maxSize={35}>
                    {selectedThread && (
                      <ChatInfoPanel
                        contactName={selectedThread.wa_contact?.profile_name || `WhatsApp ${selectedThread.wa_contact?.wa_phone_formatted}`}
                        contactImage={undefined}
                        contactNumber={selectedThread.wa_contact?.wa_phone_formatted || ''}
                        onClose={toggleInfoPanel}
                      />
                    )}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>

            {/* New Conversation Dialog */}
            <Dialog open={showNewConversationDialog} onOpenChange={setShowNewConversationDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Conversa WhatsApp</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Contact Search */}
                  <div>
                    <label className="text-sm font-medium">Buscar contato</label>
                    <Input
                      placeholder="Digite o nome do contato..."
                      value={contactSearchTerm}
                      onChange={(e) => setContactSearchTerm(e.target.value)}
                    />
                    {contactSearchTerm && (
                      <div className="max-h-40 overflow-y-auto border rounded mt-2">
                        {filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => handleContactSelect(contact)}
                            className="p-2 hover:bg-muted cursor-pointer flex items-center space-x-2"
                          >
                            <User className="w-4 h-4" />
                            <div>
                              <div className="font-medium text-sm">{contact.nome || contact.nome_fantasia}</div>
                              <div className="text-xs text-muted-foreground">
                                {contact.celular || contact.telefone}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredContacts.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum contato encontrado
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Contact Display */}
                  {selectedContact && (
                    <div className="p-3 bg-muted rounded">
                      <div className="font-medium text-sm text-center">
                        {selectedContact.nome || selectedContact.nome_fantasia}
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        {selectedContact.celular || selectedContact.telefone}
                      </div>
                    </div>
                  )}

                  {/* Phone Number Input */}
                  <div>
                    <label className="text-sm font-medium">Número do WhatsApp</label>
                    <Input
                      placeholder="(31) 98219-6325"
                      value={newConversationPhone}
                      onChange={(e) => setNewConversationPhone(e.target.value)}
                    />
                  </div>

                  {/* Initial Message */}
                  <div>
                    <label className="text-sm font-medium">Mensagem inicial (opcional)</label>
                    <Textarea
                      placeholder="Digite a mensagem inicial..."
                      value={newConversationMessage}
                      onChange={(e) => setNewConversationMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewConversationDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateConversation} disabled={!newConversationPhone}>
                    Criar Conversa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </AppLayout>
  );
}