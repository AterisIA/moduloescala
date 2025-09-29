export interface Employee {
  id: string;
  name: string;
  position: string;
  avatar?: string;
  department: string;
  weeklyHours: number;
  workedHours: number;
  expectedHours: number;
}

export interface Schedule {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'work' | 'break' | 'rest' | 'vacation';
  location?: string;
  startDateTime?: Date;
  endDateTime?: Date;
}

// Interface para dados da tabela escala do Supabase
export interface Escala {
  idescala: number;
  nomepessoaescala: string;
  dataescala: string; // timestamp without time zone
  finalescala: string | null; // timestamp without time zone
  telefone: string | null;
}

export type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';