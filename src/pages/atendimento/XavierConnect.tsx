import { useState } from "react";
import { useAtendimento } from "@/hooks/useAtendimento";
import { KanbanBoard } from "@/components/atendimento/KanbanBoard";
import { ChatWindow } from "@/components/atendimento/ChatWindow";
import { NewTicketDialog } from "@/components/atendimento/NewTicketDialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, MessageSquare } from "lucide-react";

export default function XavierConnectPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const { tickets, messages, loading, sendMessage, updateTicketStatus, createTicket, refetch } = useAtendimento(selectedTicketId);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Handler para criar ticket
  const handleCreateTicket = async (contatoId: string) => {
      const ticketId = await createTicket(contatoId);
      if (ticketId) {
          setSelectedTicketId(ticketId);
          setIsNewTicketOpen(false);
      }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] space-y-4">
        
        {/* Barra de Ferramentas Superior */}
        <div className="flex items-center justify-between px-2 pt-2 shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Xavier Connect
            </h1>
            <p className="text-sm text-muted-foreground">Central de Atendimento Omnichannel</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} title="Recarregar lista">
              <RefreshCw className="w-4 h-4 md:mr-2" /> 
              <span className="hidden md:inline">Atualizar</span>
            </Button>
            <Button size="sm" onClick={() => setIsNewTicketOpen(true)}>
              <PlusCircle className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Novo Atendimento</span>
            </Button>
          </div>
        </div>

        {/* Área Principal (Grid Dividido) */}
        <div className="flex flex-1 gap-4 overflow-hidden rounded-xl border bg-background shadow-sm relative">
          
          {/* COLUNA DA ESQUERDA: Kanban/Lista */}
          <div className={`
            w-full md:w-[380px] lg:w-[420px] xl:w-[450px] flex flex-col border-r bg-muted/10 transition-all duration-300
            ${selectedTicketId ? 'hidden md:flex' : 'flex'}
          `}>
            <div className="p-4 overflow-x-auto h-full scrollbar-thin">
              {loading && tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-sm">Sincronizando atendimentos...</span>
                </div>
              ) : (
                <KanbanBoard 
                  tickets={tickets}
                  onSelectTicket={(t) => setSelectedTicketId(t.id)} 
                  selectedTicketId={selectedTicketId}
                  onMoveTicket={updateTicketStatus}
                />
              )}
            </div>
          </div>

          {/* COLUNA DA DIREITA: Chat Ativo */}
          <div className={`
            flex-1 flex flex-col h-full bg-white dark:bg-slate-950 transition-all duration-300
            ${!selectedTicketId ? 'hidden md:flex' : 'flex'}
          `}>
            {selectedTicket ? (
              <ChatWindow 
                ticket={selectedTicket} 
                messages={messages}
                onSendMessage={sendMessage}
                onUpdateStatus={updateTicketStatus}
                onClose={() => setSelectedTicketId(null)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center opacity-60">
                <div className="w-32 h-32 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-16 h-16 text-primary/40" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Pronto para atender</h3>
                <p className="max-w-md text-sm">
                  Selecione um cartão no quadro ao lado ou inicie um novo atendimento.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* MODAL NOVO ATENDIMENTO */}
        <NewTicketDialog 
            isOpen={isNewTicketOpen} 
            onClose={() => setIsNewTicketOpen(false)} 
            onContactSelect={handleCreateTicket} 
        />

      </div>
    </AppLayout>
  );
}
