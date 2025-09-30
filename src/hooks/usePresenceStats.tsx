import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewMode, StatusPresenca, PresenceStats, EntityWithStats } from '@/types/presence';
import { ViewType } from '@/types/calendar';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function usePresenceStats(viewMode: ViewMode, viewType: ViewType, currentDate: Date) {
  const [entities, setEntities] = useState<EntityWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'terceirizados') {
      setEntities([]);
      setLoading(false);
      return;
    }
    fetchPresenceStats();
  }, [viewMode, viewType, currentDate]);

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
      default:
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
    }
  };

  const fetchPresenceStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getDateRange();

      // Fetch status presence data
      const { data: statusData, error: statusError } = await (supabase as any)
        .from('StatusPresenca')
        .select('*');

      if (statusError) throw statusError;

      // Fetch escalas with date filtering
      const { data: escalasData, error: escalasError } = await (supabase as any)
        .from('escala')
        .select('*')
        .gte('dataescala', start.toISOString())
        .lte('dataescala', end.toISOString());

      if (escalasError) throw escalasError;

      // Fetch entities based on view mode
      let entitiesData: any[] = [];
      let entityIdField = '';
      let entityNameField = '';

      if (viewMode === 'coordenadores') {
        const { data, error } = await (supabase as any)
          .from('coordenador')
          .select('*');
        if (error) throw error;
        entitiesData = data || [];
        entityIdField = 'id_coordenador';
        entityNameField = 'nome';
      } else if (viewMode === 'plantao') {
        const { data, error } = await (supabase as any)
          .from('plantao')
          .select('*');
        if (error) throw error;
        entitiesData = data || [];
        entityIdField = 'id_plantao';
        entityNameField = 'nome';
      } else if (viewMode === 'empresa') {
        const { data: plantaoData, error: plantaoError } = await (supabase as any)
          .from('plantao')
          .select('*');
        if (plantaoError) throw plantaoError;

        const { data, error } = await (supabase as any)
          .from('empresa')
          .select('*');
        if (error) throw error;
        entitiesData = data || [];
        entityIdField = 'id_empresa';
        entityNameField = 'nome';

        // For empresa, we need plantao mapping
        const plantaoMap = new Map(plantaoData?.map((p: any) => [String(p.id_plantao), String(p.id_empresa)]) || []);
        
        // Calculate stats for each empresa
        const entityStatsMap = new Map<string, PresenceStats>();

        escalasData?.forEach((escala: any) => {
          if (!escala.id_plantao) return;
          
          const empresaId = plantaoMap.get(String(escala.id_plantao));
          if (!empresaId || typeof empresaId !== 'string') return;

          const statuses = statusData?.filter((s: any) => s.id_escala === escala.idescala) || [];
          
          if (!entityStatsMap.has(empresaId as string)) {
            entityStatsMap.set(empresaId as string, { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 });
          }

          const stats = entityStatsMap.get(empresaId as string)!;
          statuses.forEach((status: any) => {
            if (status.status === 1) stats.presenca++;
            else if (status.status === 5) stats.atestado++;
            else if (status.status === 3) stats.falta++;
            else if (status.status === 4) stats.faltaJustificada++;
          });
        });

        const result = entitiesData.map((entity: any) => ({
          id: String(entity[entityIdField]),
          name: String(entity[entityNameField]),
          stats: entityStatsMap.get(String(entity[entityIdField])) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 }
        }));

        setEntities(result);
        setLoading(false);
        return;
      }

      // For coordenadores and plantao
      const entityStatsMap = new Map<string, PresenceStats>();

      escalasData?.forEach((escala: any) => {
        const entityId = String(viewMode === 'coordenadores' ? escala.id_coordenador : escala.id_plantao);
        if (!entityId || entityId === 'null' || entityId === 'undefined') return;

        const statuses = statusData?.filter((s: any) => s.id_escala === escala.idescala) || [];
        
        if (!entityStatsMap.has(entityId)) {
          entityStatsMap.set(entityId, { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 });
        }

        const stats = entityStatsMap.get(entityId)!;
        statuses.forEach((status: any) => {
          if (status.status === 1) stats.presenca++;
          else if (status.status === 5) stats.atestado++;
          else if (status.status === 3) stats.falta++;
          else if (status.status === 4) stats.faltaJustificada++;
        });
      });

      const result = entitiesData.map((entity: any) => ({
        id: String(entity[entityIdField]),
        name: String(entity[entityNameField]),
        stats: entityStatsMap.get(String(entity[entityIdField])) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 }
      }));

      setEntities(result);
    } catch (err) {
      console.error('Error fetching presence stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  return { entities, loading, error };
}
