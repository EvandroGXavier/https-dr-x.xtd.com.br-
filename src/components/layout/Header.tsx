import { Bell, Search, Settings, User, LogOut, Shield, Menu, Database } from "lucide-react";
import { startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AjudaButton } from "@/components/ajuda/AjudaButton";
import { useSaasButton } from "@/hooks/useSaasButton";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const { isVisible: showSaasButton } = useSaasButton();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    startTransition(() => {
      signOut();
    });
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm shadow-soft sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 lg:px-6 gap-2 sm:gap-4 lg:gap-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">XA</span>
          </div>
          <span className="font-bold text-lg lg:text-xl text-primary hidden sm:block">
            DR. ADV
          </span>
          <span className="font-bold text-lg text-primary sm:hidden">
            XA
          </span>
        </div>

        {/* Search - Hidden on mobile, show icon only */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar processos, clientes, documentos..."
              className="pl-9 bg-secondary/50 border-border/50 focus:bg-background transition-smooth"
            />
          </div>
        </div>

        {/* Mobile Search Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Help Button */}
          <AjudaButton className="hidden sm:flex" />

          {/* Notifications - Hidden on small mobile */}
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-[10px] text-destructive-foreground flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Settings - Hidden on small mobile */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="h-5 w-5" />
          </Button>

          {/* SaaS Button - Only visible with hotkey and specific email */}
          {showSaasButton && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex"
              onClick={() => navigate('/admin/saas')}
              title="Administração SaaS"
            >
              <Database className="h-5 w-5" />
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/avatars/01.png" alt="@user" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.nome?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile?.email}
                  </p>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-primary" />
                      <span className="text-xs text-primary font-medium">Admin</span>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};