import { useState, useEffect, useRef } from "react";
import { Ticket, Message } from "@/hooks/useAtendimento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getContactPhone, getContactInitials } from "@/lib/contactUtils";

interface ChatWindowProps {
  ticket: Ticket;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onUpdateStatus: (ticketId: string, newStatus: string) => void;
  onClose: () => void;
}

export function ChatWindow({ ticket, messages, onSendMessage, onClose }: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background shadow-sm">
      <div className="p-3 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarFallback>{getContactInitials(ticket.contato?.nome_fantasia)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{ticket.contato?.nome_fantasia}</h3>
            <span className="text-xs text-muted-foreground">{getContactPhone(ticket.contato)}</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('/wa-background.png')] bg-opacity-10">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.from_me ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-lg p-3 text-sm shadow-sm relative",
                msg.from_me 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-white text-foreground rounded-tl-none border"
              )}
            >
              <p>{msg.body}</p>
              <span className="text-[10px] opacity-70 absolute bottom-1 right-2">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-background flex items-center gap-2">
        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Digite uma mensagem..." 
          className="flex-1 rounded-full bg-muted/50 border-none focus-visible:ring-1"
        />
        <Button onClick={handleSend} size="icon" className="rounded-full shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
