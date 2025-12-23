import { useState, useEffect } from 'react';
import {
  Home, FileText, Calendar, Users, DollarSign, Mail, Phone,
  MessageSquare, Settings, Search, Filter, Tag, Archive,
  Star, Clock, Bell, Check, AlertCircle, HelpCircle, Send, Trash,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const AVAILABLE_ICONS = [
  { name: 'Home', icon: Home, label: 'Início', color: 'text-blue-500' },
  { name: 'FileText', icon: FileText, label: 'Documentos', color: 'text-green-500' },
  { name: 'Calendar', icon: Calendar, label: 'Agenda', color: 'text-purple-500' },
  { name: 'Users', icon: Users, label: 'Contatos', color: 'text-cyan-500' },
  { name: 'DollarSign', icon: DollarSign, label: 'Financeiro', color: 'text-emerald-500' },
  { name: 'Mail', icon: Mail, label: 'E-mails', color: 'text-red-500' },
  { name: 'Phone', icon: Phone, label: 'Chamadas', color: 'text-orange-500' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Mensagens', color: 'text-indigo-500' },
  { name: 'Settings', icon: Settings, label: 'Configurações', color: 'text-gray-500' },
  { name: 'Search', icon: Search, label: 'Buscar', color: 'text-yellow-500' },
  { name: 'Filter', icon: Filter, label: 'Filtros', color: 'text-pink-500' },
  { name: 'Tag', icon: Tag, label: 'Etiquetas', color: 'text-violet-500' },
  { name: 'Archive', icon: Archive, label: 'Arquivo', color: 'text-amber-500' },
  { name: 'Star', icon: Star, label: 'Favoritos', color: 'text-yellow-400' },
  { name: 'Clock', icon: Clock, label: 'Histórico', color: 'text-teal-500' },
  { name: 'Bell', icon: Bell, label: 'Notificações', color: 'text-rose-500' },
  { name: 'Check', icon: Check, label: 'Concluídos', color: 'text-lime-500' },
  { name: 'AlertCircle', icon: AlertCircle, label: 'Alertas', color: 'text-red-600' },
  { name: 'HelpCircle', icon: HelpCircle, label: 'Ajuda', color: 'text-blue-400' },
  { name: 'Send', icon: Send, label: 'Enviar', color: 'text-sky-500' },
];

interface ShortcutConfig {
  id: string;
  iconName: string;
  label: string;
  action?: string;
}

export function ShortcutsPanel() {
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('whatsapp-shortcuts-collapsed');
    return saved === 'true';
  });
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(
    AVAILABLE_ICONS.map((icon, idx) => ({
      id: `shortcut-${idx}`,
      iconName: icon.name,
      label: icon.label,
    }))
  );

  useEffect(() => {
    localStorage.setItem('whatsapp-shortcuts-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const handleShortcutClick = (shortcut: ShortcutConfig) => {
    toast({
      title: shortcut.label,
      description: `Atalho "${shortcut.label}" clicado`,
    });
  };

  const handleConfigureShortcut = (shortcutId: string) => {
    toast({
      title: "Configurar Atalho",
      description: "Funcionalidade de configuração em desenvolvimento",
    });
  };

  const handleRemoveShortcut = (shortcutId: string) => {
    setShortcuts(shortcuts.filter(s => s.id !== shortcutId));
    toast({
      title: "Atalho removido",
      variant: "destructive",
    });
  };

  return (
    <div className={cn("h-full flex flex-col border-r bg-background transition-all", isCollapsed ? "w-14" : "w-60")}>
      <div className="p-2 border-b flex items-center justify-between">
        {!isCollapsed && <h3 className="text-sm font-semibold text-muted-foreground">Atalhos</h3>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 w-7 ml-auto"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {shortcuts.map((shortcut) => {
            const iconData = AVAILABLE_ICONS.find((i) => i.name === shortcut.iconName);
            const IconComponent = iconData?.icon || HelpCircle;
            const iconColor = iconData?.color || 'text-muted-foreground';

            return (
              <ContextMenu key={shortcut.id}>
                <ContextMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full h-9",
                      isCollapsed ? "justify-center p-0" : "justify-start gap-2",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => handleShortcutClick(shortcut)}
                  >
                    <IconComponent className={cn("w-4 h-4 flex-shrink-0", iconColor)} />
                    {!isCollapsed && <span className="truncate text-xs">{shortcut.label}</span>}
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleConfigureShortcut(shortcut.id)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => handleRemoveShortcut(shortcut.id)}
                    className="text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Remover
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
