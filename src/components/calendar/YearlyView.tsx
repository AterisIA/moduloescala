import React, { Fragment } from "react";
import { 
  format, 
  eachWeekOfInterval, 
  startOfYear, 
  endOfYear,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { EntityWithStats, ViewMode } from "@/types/presence";
import { StatusQuadrants } from "./StatusQuadrants";
import { PresenceStats } from "@/types/presence";

interface YearlyViewProps {
  currentDate: Date;
  entities: EntityWithStats[];
  viewMode: ViewMode;
}

export function YearlyView({ currentDate, entities, viewMode }: YearlyViewProps) {
  const yearWeeks = eachWeekOfInterval(
    { start: startOfYear(currentDate), end: endOfYear(currentDate) },
    { weekStartsOn: 1 }
  );

  // Group weeks by month
  const weeksByMonth: { [key: string]: Date[] } = {};
  const monthNames: string[] = [];
  
  yearWeeks.forEach((week) => {
    const monthKey = format(week, 'MMM', { locale: ptBR });
    if (!weeksByMonth[monthKey]) {
      weeksByMonth[monthKey] = [];
      monthNames.push(monthKey);
    }
    weeksByMonth[monthKey].push(week);
  });

  const getWeekStats = (entity: EntityWithStats, weekStart: Date): PresenceStats => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const aggregated: PresenceStats = {
      presenca: 0,
      atestado: 0,
      falta: 0,
      faltaJustificada: 0
    };

    weekDays.forEach(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const stats = entity.stats.get(dateKey);
      if (stats) {
        aggregated.presenca += stats.presenca;
        aggregated.atestado += stats.atestado;
        aggregated.falta += stats.falta;
        aggregated.faltaJustificada += stats.faltaJustificada;
      }
    });

    return aggregated;
  };

  const totalWeeks = yearWeeks.length;

  return (
    <div className="calendar-scroll-container h-full overflow-auto">
      <div 
        className="grid min-h-0" 
        style={{ 
          gridTemplateColumns: `minmax(200px, 300px) repeat(${totalWeeks}, minmax(60px, 1fr))`,
        }}
      >
        {/* Month header row */}
        <div className="calendar-cell calendar-cell-fixed bg-muted font-semibold sticky top-0 z-20">
          <div className="p-4">
            {viewMode === 'terceirizados' ? 'Terceirizados' : 
             viewMode === 'coordenadores' ? 'Coordenadores' : 
             viewMode === 'plantao' ? 'Plantões' : 'Empresas'}
          </div>
        </div>
        
        {monthNames.map((month, monthIndex) => {
          const weeksInMonth = weeksByMonth[month];
          return (
            <div 
              key={month}
              className="calendar-cell bg-primary/10 font-semibold sticky top-0 z-20 text-center"
              style={{ 
                gridColumn: `span ${weeksInMonth.length}` 
              }}
            >
              <div className="p-2 text-sm">{month}</div>
            </div>
          );
        })}

        {/* Week number row */}
        <div className="calendar-cell calendar-cell-fixed bg-muted/50 text-xs font-medium sticky top-12 z-20">
          <div className="p-2">Semana</div>
        </div>
        
        {yearWeeks.map((week, weekIndex) => (
          <div 
            key={weekIndex} 
            className="calendar-cell bg-muted/50 text-xs font-medium text-center sticky top-12 z-20"
          >
            <div className="p-1">{weekIndex + 1}</div>
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
            
            {yearWeeks.map((week, weekIndex) => {
              const stats = getWeekStats(entity, week);
              
              return (
                <div 
                  key={`${entity.id}-week-${weekIndex}`}
                  className="calendar-cell flex items-center justify-center p-1"
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
