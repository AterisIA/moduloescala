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
      const entities: EntityQuadrantData[] = [];

      // 1) Load escala within range (no join needed)
      const escalaResult = await (supabase as any)
        .from('escala')
        .select('idescala, dataescala, id_coordenador, id_plantao')
        .gte('dataescala', startDate.toISOString())
        .lte('dataescala', endDate.toISOString());
      const escalas = (escalaResult.data || []) as Array<{
        idescala: number;
        dataescala: string;
        id_coordenador: string | null;
        id_plantao: string | null;
      }>;
      if (escalaResult.error) throw escalaResult.error;

      // Build escala maps
      const escalaById = new Map<number, { dateKey: string; id_coordenador: string | null; id_plantao: string | null }>();
      const escalaIds: number[] = [];
      escalas.forEach((e) => {
        // Keep date only, avoid TZ shifts
        const dateKey = (typeof e.dataescala === 'string' ? e.dataescala.substring(0, 10) : new Date(e.dataescala).toISOString().substring(0, 10));
        escalaById.set(e.idescala, { dateKey, id_coordenador: e.id_coordenador, id_plantao: e.id_plantao });
        escalaIds.push(e.idescala);
      });

      if (escalaIds.length === 0) return [];

      // 2) Load StatusPresenca for those escalas
      const statusResult = await (supabase as any)
        .from('StatusPresenca')
        .select('id, status, id_escala')
        .in('id_escala', escalaIds);
      const statusRows = statusResult.data as Array<{ id: number; status: number; id_escala: number }> | null;
      if (statusResult.error) throw statusResult.error;

      // 3) Preload dictionaries (names)
      let coordDict = new Map<string, string>();
      let plantaoDict = new Map<string, { nome: string; id_empresa: string }>();
      let empresaDict = new Map<string, string>();

      if (filterType === 'Coordenadores') {
        const coordRes = await (supabase as any).from('coordenador').select('*');
        (coordRes.data as CoordenadorData[] | null)?.forEach((c) => coordDict.set(c.id_coordenador, c.nome));
      }
      if (filterType === 'Plantões' || filterType === 'Empresas') {
        const plantaoRes = await (supabase as any).from('plantao').select('*');
        (plantaoRes.data as PlantaoData[] | null)?.forEach((p) => plantaoDict.set(p.id_plantao, { nome: p.nome, id_empresa: p.id_empresa }));
      }
      if (filterType === 'Empresas') {
        const empRes = await (supabase as any).from('empresa').select('*');
        (empRes.data as EmpresaData[] | null)?.forEach((e) => empresaDict.set(e.id_empresa, e.nome));
      }

      // 4) Accumulate quadrants per entity/date
      const groupMap = new Map<string, Map<string, QuadrantData>>();

      statusRows?.forEach((row) => {
        const esc = escalaById.get(row.id_escala);
        if (!esc) return;

        let groupId: string | null = null;
        if (filterType === 'Coordenadores') groupId = esc.id_coordenador;
        else if (filterType === 'Plantões') groupId = esc.id_plantao;
        else if (filterType === 'Empresas') {
          const plant = esc.id_plantao ? plantaoDict.get(esc.id_plantao) : undefined;
          groupId = plant ? plant.id_empresa : null;
        }
        if (!groupId) return;

        if (!groupMap.has(groupId)) groupMap.set(groupId, new Map());
        const dateMap = groupMap.get(groupId)!;
        if (!dateMap.has(esc.dateKey))
          dateMap.set(esc.dateKey, { presenca: 0, atraso: 0, falta: 0, faltaJustificada: 0, atestado: 0 });

        const q = dateMap.get(esc.dateKey)!;
        switch (row.status) {
          case 1: q.presenca++; break;
          case 2: q.atraso++; break;
          case 3: q.falta++; break;
          case 4: q.faltaJustificada++; break;
          case 5: q.atestado++; break;
        }
      });

      // 5) Build entities with names
      if (filterType === 'Coordenadores') {
        groupMap.forEach((quadrants, id) => {
          entities.push({ id, name: coordDict.get(id) || 'Coordenador', type: filterType, quadrants });
        });
      } else if (filterType === 'Plantões') {
        groupMap.forEach((quadrants, id) => {
          const p = plantaoDict.get(id);
          const empresaNome = p ? (empresaDict.get(p.id_empresa) || '') : '';
          entities.push({ id, name: p ? `${p.nome}${empresaNome ? ' - ' + empresaNome : ''}` : 'Plantão', type: filterType, quadrants });
        });
      } else if (filterType === 'Empresas') {
        groupMap.forEach((quadrants, id) => {
          entities.push({ id, name: empresaDict.get(id) || 'Empresa', type: filterType, quadrants });
        });
      }

      console.log('Aggregated entities with quadrants:', entities);
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