import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewMode, EntityWithStats, PresenceStats } from '@/types/presence';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function usePresenceStats(viewMode: ViewMode, currentDate: Date, viewType: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  const [entities, setEntities] = useState<EntityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPresenceStats();
  }, [viewMode, currentDate, viewType]);

  const getDateRange = () => {
    switch (viewType) {
      case 'daily':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'weekly':
        return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) };
      case 'monthly':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
      case 'yearly':
        return { start: startOfYear(currentDate), end: endOfYear(currentDate) };
    }
  };

  const fetchPresenceStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateRange = getDateRange();

      // Fetch all necessary data
      const { data: escalasData, error: escalasError } = await supabase
        .from('escala')
        .select('idescala, dataescala, id_coordenador, id_plantao')
        .gte('dataescala', dateRange.start.toISOString())
        .lte('dataescala', dateRange.end.toISOString());

      const statusResult = await (supabase as any)
        .from('StatusPresenca')
        .select('*');
      const statusData = statusResult.data;
      const statusError = statusResult.error;

      if (escalasError) throw escalasError;
      if (statusError) throw statusError;

      // Create status map
      const statusMap = new Map<number, any[]>();
      statusData?.forEach((status: any) => {
        const existing = statusMap.get(status.id_escala) || [];
        existing.push(status);
        statusMap.set(status.id_escala, existing);
      });

      // Fetch related entities based on view mode
      let entitiesData: EntityWithStats[] = [];

      if (viewMode === 'terceirizados') {
        // Group by escala - show all escalas
        const escalaMap = new Map<number, EntityWithStats>();
        
        escalasData?.forEach((escala: any) => {
          if (!escalaMap.has(escala.idescala)) {
            escalaMap.set(escala.idescala, {
              id: String(escala.idescala),
              name: `Escala ${escala.idescala}`,
              stats: new Map()
            });
          }

          const entity = escalaMap.get(escala.idescala)!;
          const dateKey = format(new Date(escala.dataescala), 'yyyy-MM-dd');
          
          const stats = calculateStats(statusMap.get(escala.idescala) || []);
          entity.stats.set(dateKey, stats);
        });

        entitiesData = Array.from(escalaMap.values());
      } else if (viewMode === 'coordenadores') {
        const coordResult = await (supabase as any)
          .from('coordenador')
          .select('*');
        const coordenadoresData = coordResult.data;

        const coordMap = new Map<string, EntityWithStats>();
        
        coordenadoresData?.forEach((coord: any) => {
          coordMap.set(coord.id_coordenador, {
            id: coord.id_coordenador,
            name: coord.nome,
            stats: new Map()
          });
        });

        escalasData?.forEach((escala: any) => {
          if (escala.id_coordenador && coordMap.has(escala.id_coordenador)) {
            const entity = coordMap.get(escala.id_coordenador)!;
            const dateKey = format(new Date(escala.dataescala), 'yyyy-MM-dd');
            
            const currentStats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
            const newStats = calculateStats(statusMap.get(escala.idescala) || []);
            
            entity.stats.set(dateKey, {
              presenca: currentStats.presenca + newStats.presenca,
              atestado: currentStats.atestado + newStats.atestado,
              falta: currentStats.falta + newStats.falta,
              faltaJustificada: currentStats.faltaJustificada + newStats.faltaJustificada
            });
          }
        });

        entitiesData = Array.from(coordMap.values());
      } else if (viewMode === 'plantao') {
        const plantaoResult = await (supabase as any)
          .from('plantao')
          .select('*');
        const plantoesData = plantaoResult.data;

        const plantaoMap = new Map<string, EntityWithStats>();
        
        plantoesData?.forEach((plantao: any) => {
          plantaoMap.set(plantao.id_plantao, {
            id: plantao.id_plantao,
            name: plantao.nome,
            stats: new Map()
          });
        });

        escalasData?.forEach((escala: any) => {
          if (escala.id_plantao && plantaoMap.has(escala.id_plantao)) {
            const entity = plantaoMap.get(escala.id_plantao)!;
            const dateKey = format(new Date(escala.dataescala), 'yyyy-MM-dd');
            
            const currentStats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
            const newStats = calculateStats(statusMap.get(escala.idescala) || []);
            
            entity.stats.set(dateKey, {
              presenca: currentStats.presenca + newStats.presenca,
              atestado: currentStats.atestado + newStats.atestado,
              falta: currentStats.falta + newStats.falta,
              faltaJustificada: currentStats.faltaJustificada + newStats.faltaJustificada
            });
          }
        });

        entitiesData = Array.from(plantaoMap.values());
      } else if (viewMode === 'empresa') {
        const empresaResult = await (supabase as any)
          .from('empresa')
          .select('*');
        const empresasData = empresaResult.data;

        const plantaoResult = await (supabase as any)
          .from('plantao')
          .select('*');
        const plantoesData = plantaoResult.data;

        const plantaoToEmpresaMap = new Map<string, string>();
        plantoesData?.forEach((plantao: any) => {
          plantaoToEmpresaMap.set(plantao.id_plantao, plantao.id_empresa);
        });

        const empresaMap = new Map<string, EntityWithStats>();
        
        empresasData?.forEach((empresa: any) => {
          empresaMap.set(empresa.id_empresa, {
            id: empresa.id_empresa,
            name: empresa.nome,
            stats: new Map()
          });
        });

        escalasData?.forEach((escala: any) => {
          if (escala.id_plantao) {
            const empresaId = plantaoToEmpresaMap.get(escala.id_plantao);
            if (empresaId && empresaMap.has(empresaId)) {
              const entity = empresaMap.get(empresaId)!;
              const dateKey = format(new Date(escala.dataescala), 'yyyy-MM-dd');
              
              const currentStats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
              const newStats = calculateStats(statusMap.get(escala.idescala) || []);
              
              entity.stats.set(dateKey, {
                presenca: currentStats.presenca + newStats.presenca,
                atestado: currentStats.atestado + newStats.atestado,
                falta: currentStats.falta + newStats.falta,
                faltaJustificada: currentStats.faltaJustificada + newStats.faltaJustificada
              });
            }
          }
        });

        entitiesData = Array.from(empresaMap.values());
      }

      setEntities(entitiesData);
    } catch (err) {
      console.error('Error fetching presence stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (statusList: any[]): PresenceStats => {
    const stats: PresenceStats = {
      presenca: 0,
      atestado: 0,
      falta: 0,
      faltaJustificada: 0
    };

    statusList.forEach(status => {
      switch (status.status) {
        case 1:
          stats.presenca++;
          break;
        case 3:
          stats.falta++;
          break;
        case 4:
          stats.faltaJustificada++;
          break;
        case 5:
          stats.atestado++;
          break;
      }
    });

    return stats;
  };

  return {
    entities,
    loading,
    error,
    refetch: fetchPresenceStats
  };
}
