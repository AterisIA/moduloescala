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
      
      // Fetch StatusPresenca with escala data
      const statusResult = await (supabase as any)
        .from('StatusPresenca')
        .select(`
          id,
          status,
          id_escala,
          escala!inner (
            idescala,
            dataescala,
            id_coordenador,
            id_plantao
          )
        `);
      
      const statusData = statusResult.data;
      const statusError = statusResult.error;

      if (statusError) {
        console.error('Error fetching StatusPresenca:', statusError);
        throw statusError;
      }

      console.log('StatusPresenca raw data:', statusData);
      
      if (filterType === 'Coordenadores') {
        // Fetch coordenadores
        const coordResult = await (supabase as any).from('coordenador').select('*');
        const coordData = coordResult.data as CoordenadorData[] | null;
        
        // Create map to accumulate quadrant data
        const coordQuadrantsMap = new Map<string, Map<string, QuadrantData>>();
        
        // Initialize all coordinators
        coordData?.forEach(coord => {
          coordQuadrantsMap.set(coord.id_coordenador, new Map());
        });

        // Process StatusPresenca data
        statusData?.forEach((sp: any) => {
          const escala = sp.escala;
          if (!escala || !escala.id_coordenador) return;
          
          const escalaDate = new Date(escala.dataescala);
          if (escalaDate < startDate || escalaDate > endDate) return;
          
          const dateKey = escala.dataescala.split('T')[0]; // YYYY-MM-DD
          const coordMap = coordQuadrantsMap.get(escala.id_coordenador);
          
          if (coordMap) {
            if (!coordMap.has(dateKey)) {
              coordMap.set(dateKey, {
                presenca: 0,
                atraso: 0,
                falta: 0,
                faltaJustificada: 0,
                atestado: 0
              });
            }
            
            const quadrant = coordMap.get(dateKey)!;
            
            // Map status values: 1=presenca, 2=atraso, 3=falta, 4=faltaJustificada, 5=atestado
            switch (sp.status) {
              case 1: quadrant.presenca++; break;
              case 2: quadrant.atraso++; break;
              case 3: quadrant.falta++; break;
              case 4: quadrant.faltaJustificada++; break;
              case 5: quadrant.atestado++; break;
            }
          }
        });

        // Build entities array
        coordData?.forEach(coord => {
          const quadrants = coordQuadrantsMap.get(coord.id_coordenador) || new Map();
          entities.push({
            id: coord.id_coordenador,
            name: coord.nome,
            type: filterType,
            quadrants
          });
        });
        
      } else if (filterType === 'Plantões') {
        // Fetch plantões
        const plantaoResult = await (supabase as any).from('plantao').select('*');
        const plantaoData = plantaoResult.data as PlantaoData[] | null;
        
        // Fetch empresa names for plantões
        const empresaResult = await (supabase as any).from('empresa').select('*');
        const empresaData = empresaResult.data as EmpresaData[] | null;
        const empresaMap = new Map<string, string>();
        empresaData?.forEach(emp => empresaMap.set(emp.id_empresa, emp.nome));
        
        // Create map to accumulate quadrant data
        const plantaoQuadrantsMap = new Map<string, Map<string, QuadrantData>>();
        
        // Initialize all plantões
        plantaoData?.forEach(plantao => {
          plantaoQuadrantsMap.set(plantao.id_plantao, new Map());
        });

        // Process StatusPresenca data
        statusData?.forEach((sp: any) => {
          const escala = sp.escala;
          if (!escala || !escala.id_plantao) return;
          
          const escalaDate = new Date(escala.dataescala);
          if (escalaDate < startDate || escalaDate > endDate) return;
          
          const dateKey = escala.dataescala.split('T')[0];
          const plantaoMap = plantaoQuadrantsMap.get(escala.id_plantao);
          
          if (plantaoMap) {
            if (!plantaoMap.has(dateKey)) {
              plantaoMap.set(dateKey, {
                presenca: 0,
                atraso: 0,
                falta: 0,
                faltaJustificada: 0,
                atestado: 0
              });
            }
            
            const quadrant = plantaoMap.get(dateKey)!;
            
            switch (sp.status) {
              case 1: quadrant.presenca++; break;
              case 2: quadrant.atraso++; break;
              case 3: quadrant.falta++; break;
              case 4: quadrant.faltaJustificada++; break;
              case 5: quadrant.atestado++; break;
            }
          }
        });

        // Build entities array
        plantaoData?.forEach(plantao => {
          const quadrants = plantaoQuadrantsMap.get(plantao.id_plantao) || new Map();
          const empresaNome = empresaMap.get(plantao.id_empresa) || '';
          entities.push({
            id: plantao.id_plantao,
            name: `${plantao.nome} - ${empresaNome}`,
            type: filterType,
            quadrants
          });
        });
        
      } else if (filterType === 'Empresas') {
        // Fetch empresas
        const empresaResult = await (supabase as any).from('empresa').select('*');
        const empresaData = empresaResult.data as EmpresaData[] | null;
        
        // Fetch plantões to link empresas
        const plantaoResult = await (supabase as any).from('plantao').select('*');
        const plantaoData = plantaoResult.data as PlantaoData[] | null;
        
        // Map plantao to empresa
        const plantaoToEmpresaMap = new Map<string, string>();
        plantaoData?.forEach(p => plantaoToEmpresaMap.set(p.id_plantao, p.id_empresa));
        
        // Create map to accumulate quadrant data
        const empresaQuadrantsMap = new Map<string, Map<string, QuadrantData>>();
        
        // Initialize all empresas
        empresaData?.forEach(empresa => {
          empresaQuadrantsMap.set(empresa.id_empresa, new Map());
        });

        // Process StatusPresenca data
        statusData?.forEach((sp: any) => {
          const escala = sp.escala;
          if (!escala || !escala.id_plantao) return;
          
          const escalaDate = new Date(escala.dataescala);
          if (escalaDate < startDate || escalaDate > endDate) return;
          
          const empresaId = plantaoToEmpresaMap.get(escala.id_plantao);
          if (!empresaId) return;
          
          const dateKey = escala.dataescala.split('T')[0];
          const empresaMap = empresaQuadrantsMap.get(empresaId);
          
          if (empresaMap) {
            if (!empresaMap.has(dateKey)) {
              empresaMap.set(dateKey, {
                presenca: 0,
                atraso: 0,
                falta: 0,
                faltaJustificada: 0,
                atestado: 0
              });
            }
            
            const quadrant = empresaMap.get(dateKey)!;
            
            switch (sp.status) {
              case 1: quadrant.presenca++; break;
              case 2: quadrant.atraso++; break;
              case 3: quadrant.falta++; break;
              case 4: quadrant.faltaJustificada++; break;
              case 5: quadrant.atestado++; break;
            }
          }
        });

        // Build entities array
        empresaData?.forEach(empresa => {
          const quadrants = empresaQuadrantsMap.get(empresa.id_empresa) || new Map();
          entities.push({
            id: empresa.id_empresa,
            name: empresa.nome,
            type: filterType,
            quadrants
          });
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