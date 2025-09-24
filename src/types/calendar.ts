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
}

export type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';