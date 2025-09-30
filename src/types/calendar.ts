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

export type FilterType = 'Terceirizados' | 'Coordenadores' | 'Plantões' | 'Empresas';

export interface QuadrantData {
  presenca: number;      // status 1
  atraso: number;        // status 2
  falta: number;         // status 3
  faltaJustificada: number; // status 4
  atestado: number;      // status 5
}

export interface AggregatedEntity {
  id: string;
  name: string;
  type: FilterType;
}

export interface EntityQuadrantData extends AggregatedEntity {
  quadrants: Map<string, QuadrantData>; // key is date string (YYYY-MM-DD)
}