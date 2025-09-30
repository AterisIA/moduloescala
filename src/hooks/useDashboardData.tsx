import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardFilters, KPIMetric, PresenceDataPoint, StatusDistribution, EntityRanking, DashboardInsight, TopPerformer } from '@/types/dashboard';
import { startOfDay, endOfDay, subDays, format, parseISO } from 'date-fns';

export const useDashboardData = (filters: DashboardFilters) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [presenceData, setPresenceData] = useState<PresenceDataPoint[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [entityRanking, setEntityRanking] = useState<EntityRanking[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch escalas
      const escalasResponse = await (supabase as any)
        .from('escala')
        .select('*')
        .gte('dataescala', startOfDay(filters.startDate).toISOString())
        .lte('dataescala', endOfDay(filters.endDate).toISOString());

      if (escalasResponse.error) throw escalasResponse.error;
      const escalas = escalasResponse.data;

      const escalaIds = escalas?.map((e: any) => e.idescala) || [];

      // Fetch status
      const statusResponse = await (supabase as any)
        .from('StatusPresenca')
        .select('*')
        .in('id_escala', escalaIds);

      if (statusResponse.error) throw statusResponse.error;
      const statusData = statusResponse.data;

      // Fetch entities
      const coordResponse = await (supabase as any).from('coordenador').select('*');
      const plantoesResponse = await (supabase as any).from('plantao').select('*');
      const empresasResponse = await (supabase as any).from('empresa').select('*');

      const coordenadores = coordResponse.data;
      const plantoes = plantoesResponse.data;
      const empresas = empresasResponse.data;

      // Calculate KPIs
      const totalRecords = statusData?.length || 0;
      const presencaCount = statusData?.filter((s: any) => s.status === 1).length || 0;
      const atrasoCount = statusData?.filter((s: any) => s.status === 2).length || 0;
      const faltaCount = statusData?.filter((s: any) => s.status === 3).length || 0;

      const presencaRate = totalRecords > 0 ? (presencaCount / totalRecords) * 100 : 0;

      // Previous period for comparison
      const prevResponse = await (supabase as any)
        .from('StatusPresenca')
        .select('*')
        .limit(100);

      const prevStatus = prevResponse.data;
      const prevPresencaCount = prevStatus?.filter((s: any) => s.status === 1).length || 0;
      const prevTotal = prevStatus?.length || 1;
      const prevPresencaRate = (prevPresencaCount / prevTotal) * 100;
      const presencaChange = presencaRate - prevPresencaRate;

      setKpis([
        {
          id: 'presenca',
          title: 'Taxa de Presença',
          value: presencaRate,
          change: presencaChange,
          changeType: presencaChange >= 0 ? 'positive' : 'negative',
          suffix: '%'
        },
        {
          id: 'total',
          title: 'Total de Registros',
          value: totalRecords,
          change: totalRecords - prevTotal,
          changeType: 'neutral'
        },
        {
          id: 'atrasos',
          title: 'Atrasos',
          value: atrasoCount,
          change: 0,
          changeType: 'neutral'
        },
        {
          id: 'faltas',
          title: 'Faltas',
          value: faltaCount,
          change: 0,
          changeType: 'negative'
        }
      ]);

      // Status distribution
      setStatusDistribution([
        { name: 'Presença', value: presencaCount, color: 'hsl(142 75% 50%)' },
        { name: 'Atraso', value: atrasoCount, color: 'hsl(38 92% 50%)' },
        { name: 'Falta', value: faltaCount, color: 'hsl(0 84% 60%)' }
      ]);

      // Time series data (grouped by date)
      const dateMap = new Map<string, { presenca: number; atraso: number; falta: number }>();
      
      escalas?.forEach((escala: any) => {
        const dateStr = format(parseISO(escala.dataescala), 'yyyy-MM-dd');
        const status = statusData?.find((s: any) => s.id_escala === escala.idescala);
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { presenca: 0, atraso: 0, falta: 0 });
        }
        
        const dayData = dateMap.get(dateStr)!;
        if (status?.status === 1) dayData.presenca++;
        if (status?.status === 2) dayData.atraso++;
        if (status?.status === 3) dayData.falta++;
      });

      const timeSeriesData = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setPresenceData(timeSeriesData);

      // Entity ranking (coordenadores)
      if (coordenadores) {
        const rankings: EntityRanking[] = coordenadores.map((coord: any) => {
          const coordEscalas = escalas?.filter((e: any) => e.id_coordenador === coord.id_coordenador) || [];
          const coordStatuses = coordEscalas
            .map((e: any) => statusData?.find((s: any) => s.id_escala === e.idescala))
            .filter(Boolean);
          
          const total = coordStatuses.length;
          const presenca = coordStatuses.filter((s: any) => s?.status === 1).length;
          
          return {
            id: coord.id_coordenador,
            name: coord.nome,
            presenca,
            total,
            percentage: total > 0 ? (presenca / total) * 100 : 0
          };
        }).sort((a, b) => b.percentage - a.percentage);

        setEntityRanking(rankings);
      }

      // Generate insights
      const generatedInsights: DashboardInsight[] = [];
      
      if (presencaRate < 80) {
        generatedInsights.push({
          id: '1',
          type: 'warning',
          title: 'Taxa de presença abaixo do esperado',
          description: `A taxa atual é de ${presencaRate.toFixed(1)}%. Recomenda-se investigar os motivos.`,
          action: 'Ver detalhes'
        });
      }

      if (faltaCount > totalRecords * 0.1) {
        generatedInsights.push({
          id: '2',
          type: 'alert',
          title: 'Alto índice de faltas',
          description: `${faltaCount} faltas registradas no período (${((faltaCount/totalRecords)*100).toFixed(1)}%).`,
          action: 'Analisar'
        });
      }

      if (presencaChange > 5) {
        generatedInsights.push({
          id: '3',
          type: 'success',
          title: 'Melhoria significativa',
          description: `A presença aumentou ${presencaChange.toFixed(1)}% em relação ao período anterior.`,
        });
      }

      setInsights(generatedInsights);

      // Top performers
      if (coordenadores && escalas) {
        const performers: TopPerformer[] = coordenadores
          .map((coord: any) => {
            const coordEscalas = escalas.filter((e: any) => e.id_coordenador === coord.id_coordenador);
            const coordStatuses = coordEscalas
              .map((e: any) => statusData?.find((s: any) => s.id_escala === e.idescala))
              .filter(Boolean);
            
            const totalDays = coordStatuses.length;
            const presentDays = coordStatuses.filter((s: any) => s?.status === 1).length;
            
            return {
              id: coord.id_coordenador,
              name: coord.nome,
              entity: 'Coordenador',
              presencaRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
              totalDays,
              presentDays
            };
          })
          .filter((p: any) => p.totalDays > 0)
          .sort((a: any, b: any) => b.presencaRate - a.presencaRate)
          .slice(0, 10);

        setTopPerformers(performers);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    kpis,
    presenceData,
    statusDistribution,
    entityRanking,
    insights,
    topPerformers,
    refetch: fetchDashboardData
  };
};
