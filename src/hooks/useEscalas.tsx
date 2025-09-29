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
        const employeeId = escala.nomepessoaescala.replace(/\s+/g, '_').toLowerCase();
        
        // Create unique employee
        if (!uniqueEmployees.has(employeeId)) {
          uniqueEmployees.set(employeeId, {
            id: employeeId,
            name: escala.nomepessoaescala,
            position: "Funcionário", // Default position
            department: "Geral", // Default department
            weeklyHours: 40,
            workedHours: 0,
            expectedHours: 40,
            avatar: escala.nomepessoaescala.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          });
        }

        // Create schedule from escala
        const startDate = new Date(escala.dataescala);
        const endDate = escala.finalescala ? new Date(escala.finalescala) : new Date(startDate);
        
        // Extract time from dates
        const startTime = startDate.toTimeString().substring(0, 5); // HH:MM
        const endTime = endDate.toTimeString().substring(0, 5); // HH:MM
        
        // If it's a multi-day schedule, create entries for each day
        const currentDate = new Date(startDate);
        const finalDate = new Date(endDate);
        
        // Reset time to start of day for date comparison
        currentDate.setHours(0, 0, 0, 0);
        finalDate.setHours(23, 59, 59, 999);
        
        while (currentDate <= finalDate) {
          schedulesArray.push({
            id: `${escala.idescala}_${currentDate.toISOString().split('T')[0]}`,
            employeeId,
            date: new Date(currentDate),
            startTime,
            endTime,
            type: 'work',
            location: undefined
          });
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      setEmployees(Array.from(uniqueEmployees.values()));
      setSchedules(schedulesArray);
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