export interface DashboardFilters {
  startDate: Date;
  endDate: Date;
}

export interface CommunicationResponse {
  idresposta: number;
  idescala: number;
  idcomunicacao: number;
  status: string;
  dtcomunicacao: string;
  dtresposta?: string;
  horaresposta?: string;
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
  confirmado: number;
  atraso: number;
  falta: number;
  aguardando: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface EntityRanking {
  id: number;
  name: string;
  confirmados: number;
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
