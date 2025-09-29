import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Schedule } from '@/types/calendar';

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
        
        // Determine department based on relationships
        let department = "Terceirizados"; // Default
        let position = "Funcionário";
        
        if (escala.id_coordenador) {
          department = "Coordenadores";
          const coordenador = coordenadoresMap.get(escala.id_coordenador);
          if (coordenador) {
            position = `Coordenador - ${coordenador.nome}`;
          }
        } else if (escala.id_plantao) {
          const plantao = plantoesMap.get(escala.id_plantao);
          if (plantao) {
            department = "Plantões";
            position = `Plantão - ${plantao.nome}`;
            
            // Check if we should categorize by empresa
            const empresa = empresasMap.get(plantao.id_empresa);
            if (empresa) {
              // For now keep in Plantões, but we have empresa info available
              // You can change this logic if you want empresa to be a separate filter
            }
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

  return {
    employees,
    schedules,
    loading,
    error,
    refetch: fetchEscalas
  };
}