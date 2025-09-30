import React, { Fragment } from "react";
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isToday, 
  isPast, 
  isSameMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { EntityWithStats, ViewMode } from "@/types/presence";
import { StatusQuadrants } from "./StatusQuadrants";

interface MonthlyViewProps {
  currentDate: Date;
  entities: EntityWithStats[];
  viewMode: ViewMode;
}

export function MonthlyView({ currentDate, entities, viewMode }: MonthlyViewProps) {
  const monthDays = eachDayOfInterval({ 
    start: startOfMonth(currentDate), 
    end: endOfMonth(currentDate) 
  });

  const getDayClass = (date: Date) => {
    const today = isToday(date);
    const past = isPast(date) && !today;
    const currentMonth = isSameMonth(date, currentDate);
    
    return `calendar-cell ${today ? 'bg-primary/10' : ''} ${past ? 'opacity-60' : ''} ${!currentMonth ? 'text-muted-foreground' : ''}`;
  };

  return (
    <div className="calendar-scroll-container h-full overflow-auto">
      <div 
        className="grid min-h-0" 
        style={{ 
          gridTemplateColumns: `minmax(200px, 300px) repeat(${monthDays.length}, minmax(80px, 1fr))`,
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
        
        {monthDays.map(date => (
          <div 
            key={date.toISOString()} 
            className="calendar-cell bg-muted text-xs font-medium sticky top-0 z-20"
          >
            <div className="p-1 text-center">
              <div>{format(date, 'dd')}</div>
              <div className="text-[10px] text-muted-foreground">{format(date, 'EEE', { locale: ptBR })}</div>
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
            
            {monthDays.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const stats = entity.stats.get(dateKey) || { presenca: 0, atestado: 0, falta: 0, faltaJustificada: 0 };
              
              return (
                <div 
                  key={`${entity.id}-${dateKey}`}
                  className={`${getDayClass(date)} flex items-center justify-center p-1`}
                >
                  <StatusQuadrants stats={stats} size="small" />
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
