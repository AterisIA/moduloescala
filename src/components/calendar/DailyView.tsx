import React, { Fragment } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EntityWithStats, ViewMode } from "@/types/presence";
import { StatusQuadrants } from "./StatusQuadrants";

interface DailyViewProps {
  currentDate: Date;
  entities: EntityWithStats[];
  viewMode: ViewMode;
}

export function DailyView({ currentDate, entities, viewMode }: DailyViewProps) {
  // Generate hours from 00 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateKey = format(currentDate, 'yyyy-MM-dd');

  return (
    <div className="calendar-scroll-container h-full overflow-auto">
      <div 
        className="grid min-h-0" 
        style={{ 
          gridTemplateColumns: 'minmax(160px, 280px) repeat(24, minmax(56px, 1fr))',
          '--col-fixed': 'minmax(160px, 280px)',
          '--cols': '24',
          '--col-day': 'minmax(56px, 1fr)'
        } as React.CSSProperties}
      >
        {/* Header with hours */}
        <div className="calendar-cell calendar-cell-fixed bg-muted font-semibold sticky top-0 z-20">
          <div className="p-2">
            <div className="hidden md:block">{viewMode === 'terceirizados' ? 'Terceirizados' : viewMode === 'coordenadores' ? 'Coordenadores' : viewMode === 'plantao' ? 'Plantões' : 'Empresas'}</div>
            <div className="md:hidden">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</div>
            <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
              {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </div>
        
        {hours.map(hour => (
          <div key={hour} className="calendar-cell bg-muted text-xs font-medium sticky top-0 z-20 border-b">
            <div className="text-center">
              <span className="hidden sm:inline">{String(hour).padStart(2, '0')}:00</span>
              <span className="sm:hidden">{hour}</span>
            </div>
          </div>
        ))}

        {/* Entity rows */}
        {entities.map(entity => {
          const stats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
          
          return (
            <Fragment key={entity.id}>
              <div className="calendar-cell calendar-cell-fixed bg-background border-b">
                <div className="flex items-center gap-2 p-2 w-full min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs md:text-sm truncate">
                      {entity.name}
                    </div>
                  </div>
                </div>
              </div>
              
              {hours.map(hour => (
                <div 
                  key={`${entity.id}-${hour}`}
                  className="calendar-cell border-b flex items-center justify-center p-1"
                >
                  {hour === 12 ? (
                    <StatusQuadrants stats={stats} size="small" />
                  ) : (
                    <div className="w-full h-full bg-muted/30" />
                  )}
                </div>
              ))}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}