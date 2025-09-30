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
        .select('idescala, nomepessoaescala, id_coordenador, id_plantao')
        .in('idescala', uniqueEscalaIds);

      // Fetch related entities based on view type
      let coordenadoresData: any[] = [];
      let plantoesData: any[] = [];
      let empresasData: any[] = [];

      if (filters.viewType === 'coordenador') {
        const coordIds = [...new Set(escalasData?.map(e => (e as any).id_coordenador).filter(Boolean))];
        if (coordIds.length > 0) {
          const { data } = await supabase
            .from('coordenador')
            .select('id_coordenador, nome')
            .in('id_coordenador', coordIds);
          coordenadoresData = data || [];
        }
      } else if (filters.viewType === 'plantao') {
        const plantaoIds = [...new Set(escalasData?.map(e => (e as any).id_plantao).filter(Boolean))];
        if (plantaoIds.length > 0) {
          const { data } = await supabase
            .from('plantao')
            .select('id_plantao, nome')
            .in('id_plantao', plantaoIds);
          plantoesData = data || [];
        }
      } else if (filters.viewType === 'empresa') {
        const plantaoIds = [...new Set(escalasData?.map(e => (e as any).id_plantao).filter(Boolean))];
        if (plantaoIds.length > 0) {
          const { data: plantoes } = await supabase
            .from('plantao')
            .select('id_plantao, id_empresa')
            .in('id_plantao', plantaoIds);
          
          const empresaIds = [...new Set(plantoes?.map(p => (p as any).id_empresa).filter(Boolean))];
          if (empresaIds.length > 0) {
            const { data } = await supabase
              .from('empresa')
              .select('id_empresa, nome')
              .in('id_empresa', empresaIds);
            empresasData = data || [];
          }
          plantoesData = plantoes || [];
        }
      }

      // Entity ranking based on view type
      let entityMap: Map<string, { name: string; confirmados: number; total: number }>;

      if (filters.viewType === 'coordenador') {
        entityMap = new Map();
        respostas.forEach((resposta: any) => {
          const escala = escalasData?.find(e => (e as any).idescala === resposta.idescala);
          if (escala && (escala as any).id_coordenador) {
            const coordId = (escala as any).id_coordenador;
            if (!entityMap.has(coordId)) {
              const coord = coordenadoresData.find(c => c.id_coordenador === coordId);
              entityMap.set(coordId, {
                name: coord?.nome || 'Coordenador Desconhecido',
                confirmados: 0,
                total: 0
              });
            }
            const data = entityMap.get(coordId)!;
            data.total++;
            if (resposta.status === '1') data.confirmados++;
          }
        });
      } else if (filters.viewType === 'plantao') {
        entityMap = new Map();
        respostas.forEach((resposta: any) => {
          const escala = escalasData?.find(e => (e as any).idescala === resposta.idescala);
          if (escala && (escala as any).id_plantao) {
            const plantaoId = (escala as any).id_plantao;
            if (!entityMap.has(plantaoId)) {
              const plantao = plantoesData.find(p => p.id_plantao === plantaoId);
              entityMap.set(plantaoId, {
                name: plantao?.nome || 'Plantão Desconhecido',
                confirmados: 0,
                total: 0
              });
            }
            const data = entityMap.get(plantaoId)!;
            data.total++;
            if (resposta.status === '1') data.confirmados++;
          }
        });
      } else if (filters.viewType === 'empresa') {
        entityMap = new Map();
        respostas.forEach((resposta: any) => {
          const escala = escalasData?.find(e => (e as any).idescala === resposta.idescala);
          if (escala && (escala as any).id_plantao) {
            const plantao = plantoesData.find(p => p.id_plantao === (escala as any).id_plantao);
            if (plantao && plantao.id_empresa) {
              const empresaId = plantao.id_empresa;
              if (!entityMap.has(empresaId)) {
                const empresa = empresasData.find(e => e.id_empresa === empresaId);
                entityMap.set(empresaId, {
                  name: empresa?.nome || 'Empresa Desconhecida',
                  confirmados: 0,
                  total: 0
                });
              }
              const data = entityMap.get(empresaId)!;
              data.total++;
              if (resposta.status === '1') data.confirmados++;
            }
          }
        });
      } else {
        // 'all' - group by escala (default)
        entityMap = new Map();
        respostas.forEach((resposta: any) => {
          const escalaId = resposta.idescala.toString();
          if (!entityMap.has(escalaId)) {
            const escalaInfo = escalasData?.find(e => (e as any).idescala === resposta.idescala);
            entityMap.set(escalaId, {
              name: escalaInfo ? (escalaInfo as any).nomepessoaescala : `Escala ${resposta.idescala}`,
              confirmados: 0,
              total: 0
            });
          }
          const data = entityMap.get(escalaId)!;
          data.total++;
          if (resposta.status === '1') data.confirmados++;
        });
      }

      const ranking = Array.from(entityMap.entries())
        .map(([id, data]) => ({
          id: parseInt(id) || 0,
          name: data.name,
          confirmados: data.confirmados,
          total: data.total,
          percentage: data.total > 0 ? (data.confirmados / data.total) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10);

      setEntityRanking(ranking);

      // Top performers (based on confirmation rate)
      const entityTypeLabel = 
        filters.viewType === 'coordenador' ? 'Coordenador' :
        filters.viewType === 'plantao' ? 'Plantão' :
        filters.viewType === 'empresa' ? 'Empresa' : 'Escala';

      const topPerformersData = Array.from(entityMap.entries())
        .map(([id, data]) => ({
          id: id.toString(),
          name: data.name,
          entity: entityTypeLabel,
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
  }, [filters.startDate, filters.endDate, filters.viewType]);

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
