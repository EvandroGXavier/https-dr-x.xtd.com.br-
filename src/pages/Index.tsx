import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentProcesses } from "@/components/dashboard/RecentProcesses";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border shadow-soft">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bem-vindo ao DR. ADV
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus processos, clientes e finanças com eficiência profissional.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Recent Processes */}
          <div className="lg:col-span-2">
            <RecentProcesses />
          </div>

          {/* Right Column - Quick Actions & Deadlines */}
          <div className="space-y-6">
            <QuickActions />
            <UpcomingDeadlines />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
