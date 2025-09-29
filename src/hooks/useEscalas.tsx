import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Escala, Employee, Schedule } from '@/types/calendar';

export function useEscalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
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
      const { data, error } = await supabase
        .from('escala')
        .select('*')
        .order('dataescala', { ascending: true });

      if (error) throw error;

      setEscalas(data || []);
      
      // Processar dados para criar employees e schedules
      processEscalaData(data || []);
      
    } catch (err) {
      console.error('Erro ao buscar escalas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const processEscalaData = (escalasData: Escala[]) => {
    // Criar lista de funcionários únicos
    const uniqueEmployees = new Map<string, Employee>();
    
    escalasData.forEach(escala => {
      const employeeKey = escala.nomepessoaescala;
      if (!uniqueEmployees.has(employeeKey)) {
        uniqueEmployees.set(employeeKey, {
          id: employeeKey,
          name: escala.nomepessoaescala,
          position: "Funcionário", // Posição padrão
          department: "Geral", // Departamento padrão
          avatar: escala.nomepessoaescala.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
          weeklyHours: 0,
          workedHours: 0,
          expectedHours: 0
        });
      }
    });

    // Criar lista de schedules
    const processedSchedules: Schedule[] = escalasData.map(escala => {
      const startDate = new Date(escala.dataescala);
      const endDate = escala.finalescala ? new Date(escala.finalescala) : null;
      
      // Extrair horários
      const startTime = startDate.toTimeString().substring(0, 5);
      const endTime = endDate ? endDate.toTimeString().substring(0, 5) : startTime;
      
      // Determinar tipo de escala baseado no horário
      let scheduleType: 'work' | 'break' | 'rest' | 'vacation' = 'work';
      const hour = startDate.getHours();
      
      return {
        id: escala.idescala.toString(),
        employeeId: escala.nomepessoaescala,
        date: startDate,
        startTime,
        endTime,
        type: scheduleType,
        startDateTime: startDate,
        endDateTime: endDate || startDate
      };
    });

    setEmployees(Array.from(uniqueEmployees.values()));
    setSchedules(processedSchedules);
  };

  return {
    escalas,
    employees,
    schedules,
    loading,
    error,
    refetch: fetchEscalas
  };
}