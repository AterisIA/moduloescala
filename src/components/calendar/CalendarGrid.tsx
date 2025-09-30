import React, { Fragment } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EntityWithStats, ViewMode } from "@/types/presence";
import { StatusQuadrants } from "./StatusQuadrants";

interface CalendarGridProps {
  currentDate: Date;
  entities: EntityWithStats[];
  viewMode: ViewMode;
}

export function CalendarGrid({ currentDate, entities, viewMode }: CalendarGridProps) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();

  const getDayClass = (date: Date) => {
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today && !isToday;
    
    return `calendar-cell ${isToday ? 'bg-primary/10' : ''} ${isPast ? 'opacity-60' : ''}`;
  };

  return (
    <div className="calendar-scroll-container h-full overflow-auto">
      <div 
        className="grid min-h-0" 
        style={{ 
          gridTemplateColumns: `minmax(200px, 300px) repeat(${dates.length}, minmax(120px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="calendar-cell calendar-cell-fixed bg-muted font-semibold sticky top-0 z-20">
          <div className="p-4">
            {viewMode === 'terceirizados' ? 'Terceirizados' : 
             viewMode === 'coordenadores' ? 'Coordenadores' : 
             viewMode === 'plantao' ? 'Plantões' : 'Empresas'}
          </div>
        </div>
        
        {dates.map(date => (
          <div 
            key={date.toISOString()} 
            className="calendar-cell bg-muted font-semibold sticky top-0 z-20"
          >
            <div className="p-2 text-center">
              <div className="text-sm">{format(date, 'EEE', { locale: ptBR })}</div>
              <div className="text-xs text-muted-foreground">{format(date, 'dd MMM', { locale: ptBR })}</div>
            </div>
          </div>
        ))}

        {/* Entity rows */}
        {entities.map(entity => (
          <Fragment key={entity.id}>
            <div className="calendar-cell calendar-cell-fixed bg-background">
              <div className="p-4">
                <div className="font-medium text-sm truncate">{entity.name}</div>
              </div>
            </div>
            
            {dates.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const stats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
              
              return (
                <div 
                  key={`${entity.id}-${dateKey}`}
                  className={`${getDayClass(date)} flex items-center justify-center p-2`}
                >
                  <StatusQuadrants stats={stats} size="medium" />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
