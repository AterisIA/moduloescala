import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  DashboardFilters, 
  KPIMetric, 
  PresenceDataPoint, 
  StatusDistribution, 
  EntityRanking,
  DashboardInsight,
  TopPerformer,
  CommunicationResponse
} from '@/types/dashboard';
import { format, parseISO } from 'date-fns';

export const useDashboardData = (filters: DashboardFilters) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [presenceData, setPresenceData] = useState<PresenceDataPoint[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [entityRanking, setEntityRanking] = useState<EntityRanking[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch resposta_comunicacao data
      const { data: respostasData, error: respostasError } = await supabase
        .from('resposta_comunicacao')
        .select('*')
        .gte('dtcomunicacao', filters.startDate.toISOString())
        .lte('dtcomunicacao', filters.endDate.toISOString());

      if (respostasError) throw respostasError;

      const respostas = respostasData as any[] || [];

      // Calculate KPIs
      const totalComunicacoes = respostas.length;
      const aguardandoCount = respostas.filter(r => r.status === 'Aguardando').length;
      const respondidas = respostas.filter(r => r.status !== 'Aguardando').length;
      const confirmadosCount = respostas.filter(r => r.status === '1').length;
      const atrasosCount = respostas.filter(r => r.status === '2').length;
      const faltasCount = respostas.filter(r => r.status === '3').length;

      const taxaResposta = totalComunicacoes > 0 ? (respondidas / totalComunicacoes) * 100 : 0;
      const taxaConfirmacao = respondidas > 0 ? (confirmadosCount / respondidas) * 100 : 0;

      setKpis([
        {
          id: 'taxa-resposta',
          title: 'Taxa de Resposta',
          value: taxaResposta,
          change: 0,
          changeType: 'neutral',
          suffix: '%'
        },
        {
          id: 'taxa-confirmacao',
          title: 'Taxa de Confirmação',
          value: taxaConfirmacao,
          change: 0,
          changeType: taxaConfirmacao >= 80 ? 'positive' : taxaConfirmacao >= 60 ? 'neutral' : 'negative',
          suffix: '%'
        },
        {
          id: 'total-comunicacoes',
          title: 'Total de Comunicações',
          value: totalComunicacoes,
          change: 0,
          changeType: 'neutral'
        },
        {
          id: 'pendencias',
          title: 'Pendências',
          value: aguardandoCount,
          change: 0,
          changeType: aguardandoCount > 0 ? 'negative' : 'positive'
        }
      ]);

      // Status distribution
      setStatusDistribution([
        { name: 'Confirmado', value: confirmadosCount, color: 'hsl(142 75% 50%)' },
        { name: 'Atraso', value: atrasosCount, color: 'hsl(38 92% 50%)' },
        { name: 'Falta', value: faltasCount, color: 'hsl(0 84% 60%)' },
        { name: 'Aguardando', value: aguardandoCount, color: 'hsl(240 4% 46%)' }
      ]);

      // Time series data (grouped by date)
      const dateMap = new Map<string, { confirmado: number; atraso: number; falta: number; aguardando: number }>();
      
      respostas.forEach((resposta: any) => {
        const dateStr = format(parseISO(resposta.dtcomunicacao), 'yyyy-MM-dd');
        
        if (!dateMap.has(dateStr)) {
          dateMap.set(dateStr, { confirmado: 0, atraso: 0, falta: 0, aguardando: 0 });
        }
        
        const dayData = dateMap.get(dateStr)!;
        if (resposta.status === '1') dayData.confirmado++;
        if (resposta.status === '2') dayData.atraso++;
        if (resposta.status === '3') dayData.falta++;
        if (resposta.status === 'Aguardando') dayData.aguardando++;
      });

      const timeSeriesData = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({
          date,
          ...data
        }));

      setPresenceData(timeSeriesData);

      // Fetch escala data for ranking
      const uniqueEscalaIds = [...new Set(respostas.map(r => r.idescala))];
      
      const { data: escalasData } = await supabase
        .from('escala')
        .select('idescala, nomepessoaescala')
        .in('idescala', uniqueEscalaIds);

      // Entity ranking (by idescala)
      const escalaMap = new Map<number, { name: string; confirmados: number; total: number }>();
      
      respostas.forEach((resposta: any) => {
        if (!escalaMap.has(resposta.idescala)) {
          const escalaInfo = escalasData?.find(e => (e as any).idescala === resposta.idescala);
          escalaMap.set(resposta.idescala, {
            name: escalaInfo ? (escalaInfo as any).nomepessoaescala : `Escala ${resposta.idescala}`,
            confirmados: 0,
            total: 0
          });
        }
        
        const escalaData = escalaMap.get(resposta.idescala)!;
        escalaData.total++;
        if (resposta.status === '1') escalaData.confirmados++;
      });

      const ranking = Array.from(escalaMap.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          confirmados: data.confirmados,
          total: data.total,
          percentage: data.total > 0 ? (data.confirmados / data.total) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

      setEntityRanking(ranking);

      // Top performers (based on confirmation rate)
      const topPerformersData = Array.from(escalaMap.entries())
        .map(([id, data]) => ({
          id: id.toString(),
          name: data.name,
          entity: 'Escala',
          presencaRate: data.total > 0 ? (data.confirmados / data.total) * 100 : 0,
          totalDays: data.total,
          presentDays: data.confirmados
        }))
        .sort((a, b) => b.presencaRate - a.presencaRate)
        .slice(0, 10);

      setTopPerformers(topPerformersData);

      // Simple insights
      const insightsData: DashboardInsight[] = [];
      
      if (taxaResposta >= 90) {
        insightsData.push({
          id: '1',
          type: 'success',
          title: 'Excelente Taxa de Resposta',
          description: `${taxaResposta.toFixed(1)}% das comunicações foram respondidas.`
        });
      } else if (taxaResposta < 70) {
        insightsData.push({
          id: '2',
          type: 'warning',
          title: 'Taxa de Resposta Baixa',
          description: `Apenas ${taxaResposta.toFixed(1)}% das comunicações foram respondidas.`
        });
      }

      if (aguardandoCount > totalComunicacoes * 0.2) {
        insightsData.push({
          id: '3',
          type: 'alert',
          title: 'Muitas Pendências',
          description: `${aguardandoCount} comunicações ainda aguardando resposta.`
        });
      }

      setInsights(insightsData);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters.startDate, filters.endDate]);

  const refetch = () => {
    fetchDashboardData();
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
    refetch
  };
};
