import { Employee, Schedule } from '@/types/calendar';

export const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Maria Silva",
    position: "Desenvolvedora Frontend",
    department: "TI",
    weeklyHours: 40,
    workedHours: 32,
    expectedHours: 40,
    avatar: "MS"
  },
  {
    id: "2",
    name: "João Santos",
    position: "Analista de RH",
    department: "RH",
    weeklyHours: 40,
    workedHours: 38,
    expectedHours: 40,
    avatar: "JS"
  },
  {
    id: "3",
    name: "Ana Costa",
    position: "Gerente de Vendas",
    department: "Vendas",
    weeklyHours: 45,
    workedHours: 42,
    expectedHours: 45,
    avatar: "AC"
  },
  {
    id: "4",
    name: "Pedro Lima",
    position: "Especialista em Marketing",
    department: "Marketing",
    weeklyHours: 40,
    workedHours: 35,
    expectedHours: 40,
    avatar: "PL"
  },
  {
    id: "5",
    name: "Carla Mendes",
    position: "Desenvolvedora Backend",
    department: "TI",
    weeklyHours: 40,
    workedHours: 40,
    expectedHours: 40,
    avatar: "CM"
  },
  {
    id: "6",
    name: "Bruno Oliveira",
    position: "Coordenador de RH",
    department: "RH",
    weeklyHours: 40,
    workedHours: 36,
    expectedHours: 40,
    avatar: "BO"
  },
  {
    id: "7",
    name: "Sofia Rodrigues",
    position: "Executiva de Vendas",
    department: "Vendas",
    weeklyHours: 40,
    workedHours: 38,
    expectedHours: 40,
    avatar: "SR"
  },
  {
    id: "8",
    name: "Rafael Torres",
    position: "Designer UX/UI",
    department: "Marketing",
    weeklyHours: 40,
    workedHours: 39,
    expectedHours: 40,
    avatar: "RT"
  }
];

export const mockSchedules: Schedule[] = [
  // Dia 1
  { id: "1", employeeId: "1", date: new Date(2024, 0, 1), startTime: "08:00", endTime: "18:00", type: "work" },
  { id: "2", employeeId: "2", date: new Date(2024, 0, 1), startTime: "13:00", endTime: "20:00", type: "work" },
  { id: "3", employeeId: "3", date: new Date(2024, 0, 1), startTime: "20:00", endTime: "06:00", type: "work" },
  
  // Dia 2
  { id: "4", employeeId: "4", date: new Date(2024, 0, 2), startTime: "08:00", endTime: "18:00", type: "work" },
  { id: "5", employeeId: "5", date: new Date(2024, 0, 2), startTime: "13:00", endTime: "20:00", type: "work" },
  { id: "6", employeeId: "1", date: new Date(2024, 0, 2), startTime: "00:00", endTime: "23:59", type: "rest" },
  
  // Dia 3
  { id: "7", employeeId: "6", date: new Date(2024, 0, 3), startTime: "08:00", endTime: "18:00", type: "work" },
  { id: "8", employeeId: "7", date: new Date(2024, 0, 3), startTime: "20:00", endTime: "06:00", type: "work" },
  { id: "9", employeeId: "8", date: new Date(2024, 0, 3), startTime: "00:00", endTime: "23:59", type: "vacation" },
  
  // Dia 4
  { id: "10", employeeId: "2", date: new Date(2024, 0, 4), startTime: "08:00", endTime: "18:00", type: "work" },
  { id: "11", employeeId: "3", date: new Date(2024, 0, 4), startTime: "13:00", endTime: "20:00", type: "work" },
  { id: "12", employeeId: "4", date: new Date(2024, 0, 4), startTime: "20:00", endTime: "06:00", type: "work" },
  
  // Dia 5
  { id: "13", employeeId: "1", date: new Date(2024, 0, 5), startTime: "08:00", endTime: "18:00", type: "work" },
  { id: "14", employeeId: "5", date: new Date(2024, 0, 5), startTime: "13:00", endTime: "20:00", type: "work" },
  { id: "15", employeeId: "6", date: new Date(2024, 0, 5), startTime: "00:00", endTime: "23:59", type: "rest" },
];