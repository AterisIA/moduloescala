export type ViewMode = 'terceirizados' | 'coordenadores' | 'plantao' | 'empresa';

export interface StatusPresenca {
  id: number;
  status: number; // 1=Presença, 2=Atraso, 3=Falta, 4=Falta Justificada, 5=Atestado
  id_escala: number;
}

export interface PresenceStats {
  presenca: number;      // status 1
  atestado: number;      // status 5
  falta: number;         // status 3
  faltaJustificada: number; // status 4
}

export interface EntityWithStats {
  id: string;
  name: string;
  stats: Map<string, PresenceStats>; // key: date string (YYYY-MM-DD)
}
