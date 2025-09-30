import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Schedule, EntityQuadrantData, QuadrantData, FilterType } from '@/types/calendar';

interface EscalaData {
  idescala: number;
  dataescala: string;
  finalescala: string | null;
  nomepessoaescala: string;
  telefone: string | null;
  id_coordenador: string | null;
  id_plantao: string | null;
}

interface CoordenadorData {
  id_coordenador: string;
  nome: string;
}

interface PlantaoData {
  id_plantao: string;
  nome: string;
  id_empresa: string;
}

interface EmpresaData {
  id_empresa: string;
  nome: string;
}

export function useEscalas() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [aggregatedEntities, setAggregatedEntities] = useState<EntityQuadrantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEscalas();
  }, []);

  const fetchEscalas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all related data
      const { data: escalasData, error: escalasError } = await supabase
        .from('escala')
        .select('*')
        .order('dataescala', { ascending: true });

      const coordResult = await (supabase as any)
        .from('coordenador')
        .select('*');
      const coordenadoresData = coordResult.data as CoordenadorData[] | null;
      const coordError = coordResult.error;

      const plantaoResult = await (supabase as any)
        .from('plantao')
        .select('*');
      const plantoesData = plantaoResult.data as PlantaoData[] | null;
      const plantaoError = plantaoResult.error;

      const empresaResult = await (supabase as any)
        .from('empresa')
        .select('*');
      const empresasData = empresaResult.data as EmpresaData[] | null;
      const empresaError = empresaResult.error;

      if (escalasError) throw escalasError;
      if (coordError) console.warn('Error loading coordenadores:', coordError);
      if (plantaoError) console.warn('Error loading plantoes:', plantaoError);
      if (empresaError) console.warn('Error loading empresas:', empresaError);

      // Create lookup maps
      const coordenadoresMap = new Map<string, CoordenadorData>();
      coordenadoresData?.forEach((coord) => {
        coordenadoresMap.set(coord.id_coordenador, coord);
      });

      const plantoesMap = new Map<string, PlantaoData>();
      plantoesData?.forEach((plantao) => {
        plantoesMap.set(plantao.id_plantao, plantao);
      });

      const empresasMap = new Map<string, EmpresaData>();
      empresasData?.forEach((empresa) => {
        empresasMap.set(empresa.id_empresa, empresa);
      });

      // Transform data to our format
      const uniqueEmployees = new Map<string, Employee>();
      const schedulesArray: Schedule[] = [];

      escalasData?.forEach((escala: EscalaData) => {
        console.log('Processing escala:', escala);
        const employeeId = escala.nomepessoaescala.replace(/\s+/g, '_').toLowerCase();
        
        // All employees are categorized as "Terceirizados" by default
        let department = "Terceirizados";
        let position = "Funcionário";
        
        // Add coordinator info if available
        if (escala.id_coordenador) {
          const coordenador = coordenadoresMap.get(escala.id_coordenador);
          if (coordenador) {
            position = `${position} - Coord: ${coordenador.nome}`;
          }
        }
        
        // Add shift info if available
        if (escala.id_plantao) {
          const plantao = plantoesMap.get(escala.id_plantao);
          if (plantao) {
            position = `${position} - ${plantao.nome}`;
          }
        }
        
        // Create unique employee
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            id: employeeId,
            name: escala.nomepessoaescala.trim(),
            position: position,
            department: department,
            weeklyHours: 40,
            workedHours: 0,
            expectedHours: 40,
            avatar: escala.nomepessoaescala.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          });
        }

        // Create schedule from escala
        const startDate = new Date(escala.dataescala);
        const endDate = escala.finalescala ? new Date(escala.finalescala) : new Date(startDate);
        console.log(`Escala ${escala.idescala} dates:`, { startDate, endDate });
        
        // Handle multi-day schedules properly
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        const currentDate = new Date(startDateOnly);
        
        while (currentDate <= endDateOnly) {
          const isFirstDay = currentDate.getTime() === startDateOnly.getTime();
          const isLastDay = currentDate.getTime() === endDateOnly.getTime();
          const isSingleDay = startDateOnly.getTime() === endDateOnly.getTime();
          
          let dayStartTime: string;
          let dayEndTime: string;
          
          if (isSingleDay) {
            // Single day: use actual start and end times
            dayStartTime = startDate.toTimeString().substring(0, 5);
            dayEndTime = endDate.toTimeString().substring(0, 5);
          } else if (isFirstDay) {
            // First day: start at actual time, end at 23:59
            dayStartTime = startDate.toTimeString().substring(0, 5);
            dayEndTime = "23:59";
          } else if (isLastDay) {
            // Last day: start at 00:00, end at actual time
            dayStartTime = "00:00";
            dayEndTime = endDate.toTimeString().substring(0, 5);
          } else {
            // Middle days: full day
            dayStartTime = "00:00";
            dayEndTime = "23:59";
          }
          
          const schedule = {
            id: `${escala.idescala}_${currentDate.toISOString().split('T')[0]}`,
            employeeId,
            date: new Date(currentDate),
            startTime: dayStartTime,
            endTime: dayEndTime,
            type: 'work' as const,
            location: undefined
          };
          
          console.log('Created schedule:', schedule);
          schedulesArray.push(schedule);
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      setEmployees(Array.from(uniqueEmployees.values()));
      setSchedules(schedulesArray);
      console.log('Total employees:', uniqueEmployees.size);
      console.log('Total schedules:', schedulesArray.length);
      console.log('All schedules:', schedulesArray);
    } catch (err) {
      console.error('Error fetching escalas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar escalas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAggregatedData = async (filterType: FilterType, startDate: Date, endDate: Date) => {
    try {
      console.log('fetchAggregatedData called with:', { filterType, startDate, endDate });
      
      // Step 1: Fetch all entities first
      const entitiesMap = new Map<string, EntityQuadrantData>();
      
      if (filterType === 'Coordenadores') {
        const coordResult = await (supabase as any).from('coordenador').select('*');
        const coordData = coordResult.data as CoordenadorData[] | null;
        coordData?.forEach(coord => {
          entitiesMap.set(coord.id_coordenador, {
            id: coord.id_coordenador,
            name: coord.nome,
            type: filterType,
            quadrants: new Map()
          });
        });
      } else if (filterType === 'Plantões') {
        const plantaoResult = await (supabase as any).from('plantao').select('*');
        const plantaoData = plantaoResult.data as PlantaoData[] | null;
        plantaoData?.forEach(plantao => {
          entitiesMap.set(plantao.id_plantao, {
            id: plantao.id_plantao,
            name: plantao.nome,
            type: filterType,
            quadrants: new Map()
          });
        });
      } else if (filterType === 'Empresas') {
        const empresaResult = await (supabase as any).from('empresa').select('*');
        const empresaData = empresaResult.data as EmpresaData[] | null;
        empresaData?.forEach(empresa => {
          entitiesMap.set(empresa.id_empresa, {
            id: empresa.id_empresa,
            name: empresa.nome,
            type: filterType,
            quadrants: new Map()
          });
        });
      }
      
      console.log('Loaded entities:', entitiesMap.size);
      
      // Step 2: Fetch quadrant data from RPC with hours
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('Calling RPC with:', { p_filter: filterType, p_start: startDateStr, p_end: endDateStr });
      
      const { data, error } = await supabase.rpc('get_quadrant_counts_with_hours', {
        p_filter: filterType,
        p_start: startDateStr,
        p_end: endDateStr
      });
      
      if (error) {
        console.error('Error calling get_quadrant_counts_with_hours:', error);
        // Try fallback to old function without hours
        const { data: fallbackData, error: fallbackError } = await supabase.rpc('get_quadrant_counts', {
          p_filter: filterType,
          p_start: startDateStr,
          p_end: endDateStr
        });
        
        if (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        } else if (fallbackData) {
          console.log('Using fallback data (no hours):', fallbackData);
          // Process fallback data without hours
          fallbackData?.forEach((row: any) => {
            const entityId = row.entity_id;
            const dateKey = row.dt;
            
            if (entitiesMap.has(entityId)) {
              const entity = entitiesMap.get(entityId)!;
              
              const quadrantData: QuadrantData = {
                presenca: row.presenca || 0,
                atraso: row.atraso || 0,
                falta: row.falta || 0,
                faltaJustificada: row.fj_at || 0,
                atestado: 0
              };
              
              entity.quadrants.set(dateKey, quadrantData);
            }
          });
        }
      } else {
        console.log('RPC returned data with hours:', data);
        
        // Step 3: Populate quadrant data into entities
        data?.forEach((row: any) => {
          const entityId = row.entity_id;
          const dateKey = row.dt; // YYYY-MM-DD format
          
          if (entitiesMap.has(entityId)) {
            const entity = entitiesMap.get(entityId)!;
            
            const quadrantData: QuadrantData = {
              presenca: row.presenca || 0,
              atraso: row.atraso || 0,
              falta: row.falta || 0,
              faltaJustificada: row.fj_at || 0,
              atestado: 0,
              presencaHoras: parseFloat(row.presenca_horas) || 0,
              atrasoHoras: parseFloat(row.atraso_horas) || 0,
              faltaHoras: parseFloat(row.falta_horas) || 0,
              faltaJustificadaHoras: parseFloat(row.fj_at_horas) || 0,
              atestadoHoras: 0
            };
            
            entity.quadrants.set(dateKey, quadrantData);
          }
        });
      }
      
      const entities = Array.from(entitiesMap.values());
      console.log('Final entities with quadrants:', entities);
      
      return entities;
    } catch (err) {
      console.error('Error fetching aggregated data:', err);
      return [];
    }
  };

  return {
    employees,
    schedules,
    aggregatedEntities,
    loading,
    error,
    refetch: fetchEscalas,
    fetchAggregatedData
  };
}