import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SaasGuard } from "@/components/shared/SaasGuard";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AppLayout = ({ children, className }: AppLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header fixo no topo */}
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Área de conteúdo principal com sidebar e main */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main 
          className={cn(
            "flex-1 overflow-y-auto",
            "p-3 sm:p-4 md:p-6 pb-4",
            "w-full",
            className
          )}
        >
          <div className="w-full max-w-full lg:max-w-[95%] xl:max-w-none mx-auto">
            <SaasGuard>
              {children}
            </SaasGuard>
          </div>
        </main>
      </div>
      
      {/* Footer fixo na parte inferior */}
      <Footer />
    </div>
  );
};