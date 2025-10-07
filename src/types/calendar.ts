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
  isDomingoMes?: boolean;
}

export type ViewType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type FilterType = 'Terceirizados' | 'Coordenadores' | 'Plantões' | 'Empresas';

export interface QuadrantData {
  presenca: number;      // status 1 - count
  atraso: number;        // status 2 - count
  falta: number;         // status 3 - count
  faltaJustificada: number; // status 4 - count
  atestado: number;      // status 5 - count
  presencaHoras?: number;      // hours for status 1
  atrasoHoras?: number;        // hours for status 2
  faltaHoras?: number;         // hours for status 3
  faltaJustificadaHoras?: number; // hours for status 4
  atestadoHoras?: number;      // hours for status 5
}

export interface AggregatedEntity {
  id: string;
  name: string;
  type: FilterType;
}

export interface EntityQuadrantData extends AggregatedEntity {
  quadrants: Map<string, QuadrantData>; // key is date string (YYYY-MM-DD)
}