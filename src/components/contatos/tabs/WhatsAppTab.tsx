import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { useWhatsappMessages } from "@/hooks/useWhatsappMessages";
import { ContatoCompleto } from "@/types/contatos";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { StatusIcon } from "@/components/whatsapp/StatusIcon";

interface WhatsAppTabProps {
  contato: ContatoCompleto;
}

export function WhatsAppTab({ contato }: WhatsAppTabProps) {
  const [messageBody, setMessageBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, loading, sending, error, sendMessage } = useWhatsappMessages(contato.id);
  const { toast } = useToast();

  // Auto-scroll ao carregar mensagens ou receber novas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageBody.trim() || !contato.celular) return;

    const result = await sendMessage(messageBody, contato.celular);
    
    if (result.success) {
      setMessageBody("");
      toast({
        title: "Mensagem enfileirada",
        description: "A mensagem será enviada em breve.",
      });
    } else {
      toast({
        title: "Erro ao enviar",
        description: result.error || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Conversa WhatsApp
          {contato.celular && (
            <Badge variant="outline" className="ml-2">
              {contato.celular}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de mensagens */}
        <ScrollArea 
          ref={scrollRef}
          className="h-[500px] rounded-md border p-4 bg-muted/30"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem abaixo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-lg px-4 py-2 shadow-sm",
                      msg.direction === "OUTBOUND"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground border"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content?.text || msg.content?.caption || ""}
                    </p>
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-1 text-xs justify-between",
                        msg.direction === "OUTBOUND"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}
                    >
                      <span>
                        {format(new Date(msg.timestamp), "HH:mm")}
                      </span>
                      {msg.direction === "OUTBOUND" && (
                        <StatusIcon status={msg.status} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Campo de envio */}
        <div className="flex gap-2">
          <Textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
            rows={3}
            disabled={sending || !contato.celular}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !messageBody.trim() || !contato.celular}
            size="lg"
            className="px-6"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>

        {!contato.celular && (
          <p className="text-sm text-destructive">
            ⚠️ Este contato não possui celular cadastrado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
