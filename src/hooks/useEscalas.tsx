import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, Schedule } from '@/types/calendar';

interface EscalaData {
  idescala: number;
  dataescala: string;
  finalescala: string | null;
  nomepessoaescala: string;
  telefone: string | null;
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

      const { data: escalasData, error: escalasError } = await supabase
        .from('escala')
        .select('*')
        .order('dataescala', { ascending: true });

      if (escalasError) {
        throw escalasError;
      }

      // Transform data to our format
      const uniqueEmployees = new Map<string, Employee>();
      const schedulesArray: Schedule[] = [];

      escalasData?.forEach((escala: EscalaData) => {
        console.log('Processing escala:', escala);
        const employeeId = escala.nomepessoaescala.replace(/\s+/g, '_').toLowerCase();
        
        // Create unique employee
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            id: employeeId,
            name: escala.nomepessoaescala.trim(),
            position: "Funcionário", // Default position
            department: "Geral", // Default department
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