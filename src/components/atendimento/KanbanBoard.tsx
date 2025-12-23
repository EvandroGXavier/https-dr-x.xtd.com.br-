import { Ticket } from "@/hooks/useAtendimento";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getContactInitials, getContactPhone } from "@/lib/contactUtils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface KanbanBoardProps {
  tickets: Ticket[];
  onSelectTicket: (t: Ticket) => void;
  selectedTicketId?: string | null;
  onMoveTicket: (ticketId: string, newStatus: string) => void;
}

const KanbanColumn = ({ title, status, tickets, onSelect, selectedId, colorClass }: any) => {
  // Filtra tickets desta coluna
  const filtered = tickets.filter((t: Ticket) => t.status === status);

  return (
    <div className="flex flex-col h-full bg-secondary/20 rounded-xl border border-border/60 overflow-hidden">
      {/* Header */}
      <div className={`p-3 flex items-center justify-between border-b bg-card ${colorClass}`}>
        <h3 className="font-bold text-sm tracking-wide uppercase opacity-90">{title}</h3>
        <Badge variant="secondary" className="font-mono">{filtered.length}</Badge>
      </div>

      {/* Área Droppable (Onde soltamos os cards) */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 overflow-y-auto space-y-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/30'
            }`}
          >
            {filtered.map((ticket: Ticket, index: number) => (
              <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ ...provided.draggableProps.style }}
                  >
                    <Card 
                      onClick={() => onSelect(ticket)}
                      className={`
                        cursor-pointer transition-all border-l-[3px] group relative
                        ${selectedId === ticket.id ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-l-transparent border-border hover:border-l-primary/40'}
                        ${snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 z-50 opacity-90' : 'shadow-sm'}
                      `}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Linha 1: Contato */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Avatar className="h-8 w-8 border-2 border-border shadow-sm">
                              <AvatarImage src="" />
                              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                                {getContactInitials(ticket.contato?.nome_fantasia)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs truncate text-foreground/90">
                                {ticket.contato?.nome_fantasia || "Sem Nome"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {getContactPhone(ticket.contato)}
                              </span>
                            </div>
                          </div>
                          {ticket.nao_lidas > 0 && (
                            <Badge className="h-5 min-w-[1.25rem] px-1 rounded-full flex items-center justify-center text-[10px] bg-red-500 text-white animate-pulse">
                              {ticket.nao_lidas}
                            </Badge>
                          )}
                        </div>

                        {/* Linha 2: Mensagem */}
                        <div className="text-xs text-muted-foreground/80 line-clamp-2 bg-background/50 p-1.5 rounded">
                          {ticket.ultimo_mensagem || "Inicie a conversa..."}
                        </div>

                        {/* Linha 3: Rodapé */}
                        <div className="flex items-center justify-end pt-1 border-t border-dashed border-border/40 mt-1">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ticket.updated_at ? formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ptBR }) : 'Agora'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-40 gap-2">
                <AlertCircle className="w-5 h-5" />
                <span className="text-xs">Vazio</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export function KanbanBoard({ tickets, onSelectTicket, selectedTicketId, onMoveTicket }: KanbanBoardProps) {
  
  const onDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // Se soltou fora ou no mesmo lugar, não faz nada
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Se mudou de coluna (status)
    if (destination.droppableId !== source.droppableId) {
      onMoveTicket(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full pb-2 select-none">
        <KanbanColumn 
          title="Aguardando" 
          status="pending" 
          tickets={tickets} 
          onSelect={onSelectTicket} 
          selectedId={selectedTicketId}
          colorClass="border-l-4 border-l-yellow-400" 
        />
        <KanbanColumn 
          title="Em Atendimento" 
          status="open" 
          tickets={tickets} 
          onSelect={onSelectTicket} 
          selectedId={selectedTicketId}
          colorClass="border-l-4 border-l-blue-500"
        />
        <KanbanColumn 
          title="Finalizados" 
          status="closed" 
          tickets={tickets} 
          onSelect={onSelectTicket} 
          selectedId={selectedTicketId}
          colorClass="border-l-4 border-l-slate-500"
        />
      </div>
    </DragDropContext>
  );
}
