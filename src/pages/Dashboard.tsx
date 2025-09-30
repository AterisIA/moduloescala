import { useState } from "react";
import { subDays } from "date-fns";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { KPICards } from "@/components/dashboard/KPICards";
import { PresenceLineChart } from "@/components/dashboard/Charts/PresenceLineChart";
import { StatusPieChart } from "@/components/dashboard/Charts/StatusPieChart";
import { EntityBarChart } from "@/components/dashboard/Charts/EntityBarChart";
import { TopPerformersTable } from "@/components/dashboard/DataTables/TopPerformersTable";

import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardFilters as Filters } from "@/types/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [filters, setFilters] = useState<Filters>({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });

  const {
    loading,
    error,
    kpis,
    presenceData,
    statusDistribution,
    entityRanking,
    insights,
    topPerformers,
    refetch
  } = useDashboardData(filters);

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Avançado</h1>
        <p className="text-muted-foreground">
          Histórico de comunicações e desempenho de respostas
        </p>
      </div>

      <DashboardFilters filters={filters} onFiltersChange={setFilters} />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] lg:col-span-2" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      ) : (
        <>
          <KPICards metrics={kpis} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PresenceLineChart data={presenceData} />
            <StatusPieChart data={statusDistribution} />
          </div>

          <EntityBarChart data={entityRanking} />

          <TopPerformersTable data={topPerformers} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
