import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  FileText,
  Gavel,
  Home,
  Users,
  DollarSign,
  Archive,
  ChevronLeft,
  ChevronRight,
  Tag,
  Settings,
  Menu,
  X,
  MessageCircle,
  Mail,
  Warehouse,
  Phone,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/", color: "text-blue-500" },
  { icon: Gavel, label: "Processos", href: "/processos", color: "text-purple-500" },
  { icon: Users, label: "Contatos", href: "/contatos", color: "text-pink-500" },
  { icon: MessageSquare, label: "Xavier Connect", href: "/atendimento", color: "text-sky-500", badge: "Novo" },
  { icon: MessageCircle, label: "WhatsApp", href: "/whatsapp", color: "text-green-500" },
  { icon: Phone, label: "Telefonia", href: "/telefonia", color: "text-blue-600" },
  { icon: Tag, label: "Etiquetas", href: "/etiquetas", color: "text-orange-500" },
  { icon: Calendar, label: "Agenda", href: "/agenda", color: "text-cyan-500" },
  { icon: DollarSign, label: "Financeiro", href: "/financeiro", color: "text-emerald-500" },
  { icon: Warehouse, label: "Estoque", href: "/estoque", color: "text-amber-500" },
  { icon: FileText, label: "Documentos", href: "/documentos", color: "text-indigo-500" },
  { icon: Archive, label: "Biblioteca", href: "/biblioteca", color: "text-violet-500" },
  { icon: Mail, label: "E-mails", href: "/emails/configuracoes", color: "text-red-500" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios", color: "text-teal-500" },
  { icon: Settings, label: "Configurações", href: "/configuracoes", color: "text-slate-500" },
];

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const { user, profile } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebarState(profile?.empresa_id?.toString(), user?.id);
  const location = useLocation();
  const isMobile = useIsMobile();

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (onClose && showDrawer) {
      onClose();
    }
  }, [location.pathname, isMobile, onClose]);

  // Sidebar Navigation Component
  const SidebarNav = ({ isMobileSidebar = false }: { isMobileSidebar?: boolean }) => (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <li key={item.href}>
              {isMobileSidebar ? (
                <Link to={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start transition-smooth px-3",
                      isActive && "bg-primary/10 text-primary border border-primary/20"
                    )}
                    size="default"
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </Link>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start transition-smooth group",
                          isExpanded ? "px-3" : "px-2",
                          isActive && "bg-primary/10 text-primary border border-primary/20"
                        )}
                        size={isExpanded ? "default" : "icon"}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={cn(
                            "transition-transform duration-200",
                            item.color,
                            isExpanded ? "mr-3" : ""
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </motion.div>
                        {isExpanded && (
                          <span className="font-medium">{item.label}</span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  // Sidebar Footer Component
  const SidebarFooter = () => (
    <div className="p-4 border-t">
      <div className="bg-accent-light rounded-lg p-3">
        <h4 className="font-semibold text-sm text-accent mb-1">
          Plano Premium
        </h4>
        <p className="text-xs text-muted-foreground">
          Upgrade para recursos avançados
        </p>
        <Button size="sm" className="w-full mt-2 gradient-accent">
          Upgrade
        </Button>
      </div>
    </div>
  );

  // Handle mobile and tablet sidebar (anything below lg)
  const showDrawer = typeof window !== 'undefined' ? window.innerWidth < 1024 : isMobile;

  if (showDrawer) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
              <span className="font-semibold text-foreground">Menu</span>
            </div>
            <SidebarNav isMobileSidebar={true} />
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop Sidebar
  return (
    <TooltipProvider>
      <motion.aside
        animate={{ width: isExpanded ? 256 : 72 }}
        transition={{ duration: 0.2, type: "tween" }}
        className={cn(
          "hidden lg:block border-r bg-card/30 backdrop-blur-sm shadow-soft",
          "sticky top-16 h-[calc(100vh-4rem)]"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Collapse Button */}
          <div className="flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          <SidebarNav />

          {/* Footer */}
          {isExpanded && <SidebarFooter />}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};