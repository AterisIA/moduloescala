export interface DashboardFilters {
  startDate: Date;
  endDate: Date;
  entityType: 'coordenadores' | 'plantao' | 'empresa' | 'all';
  entityId?: string;
  statusFilter?: number[];
}

export interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  suffix?: string;
  prefix?: string;
}

export interface PresenceDataPoint {
  date: string;
  presenca: number;
  atestado: number;
  falta: number;
  faltaJustificada: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface EntityRanking {
  id: string;
  name: string;
  presenca: number;
  total: number;
  percentage: number;
}

export interface DashboardInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'alert';
  title: string;
  description: string;
  action?: string;
}

export interface TopPerformer {
  id: string;
  name: string;
  entity: string;
  presencaRate: number;
  totalDays: number;
  presentDays: number;
}
