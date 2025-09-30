import React, { Fragment } from "react";
import { Employee, Schedule, EntityQuadrantData, QuadrantData } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  format, 
  eachWeekOfInterval, 
  startOfYear, 
  endOfYear, 
  endOfWeek,
  getYear,
  isSameYear,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuadrantCell } from "./QuadrantCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface YearlyViewProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
  isQuadrantMode?: boolean;
  aggregatedEntities?: EntityQuadrantData[];
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
  isMonochrome?: boolean;
  displayMode?: 'absolute' | 'percentage' | 'hours';
}

export function YearlyView({ currentDate, employees, schedules, selectedDepartments, isQuadrantMode = false, aggregatedEntities = [], selectedDepartment, onDepartmentChange, departments, isMonochrome = false, displayMode = 'absolute' }: YearlyViewProps) {
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  const yearWeeks = eachWeekOfInterval(
    { start: startOfYear(currentDate), end: endOfYear(currentDate) },
    { weekStartsOn: 1 }
  ).filter(week => {
    // Apenas incluir semanas que pertencem ao ano atual
    // Uma semana pertence ao ano se a maioria dos seus dias estão no ano
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
    return getYear(weekEnd) === getYear(currentDate);
  });

  // Group weeks by month usando o final da semana para melhor agrupamento
  const weeksByMonth: { [key: string]: Date[] } = {};
  const monthNames: string[] = [];
  
  yearWeeks.forEach((week) => {
    const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
    const monthKey = format(weekEnd, 'MMM', { locale: ptBR });
    if (!weeksByMonth[monthKey]) {
      weeksByMonth[monthKey] = [];
      monthNames.push(monthKey);
    }
    weeksByMonth[monthKey].push(week);
  });

  const calculateHours = (schedule: Schedule): number => {
    if (schedule.type !== 'work') return 0;
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    return ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
  };

  const getEmployeeYearlyHours = (employeeId: string): number => {
    return schedules
      .filter(s => s.employeeId === employeeId && s.type === 'work' && isSameYear(s.date, currentDate))
      .reduce((total, schedule) => total + calculateHours(schedule), 0);
  };

  const getWeekHours = (employeeId: string, weekStart: Date): number => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return schedules
      .filter(s => 
        s.employeeId === employeeId && 
        s.type === 'work' && 
        s.date >= weekStart && 
        s.date <= weekEnd
      )
      .reduce((total, schedule) => total + calculateHours(schedule), 0);
  };

  const getMonthHours = (employeeId: string, monthName: string): number => {
    const monthWeeks = weeksByMonth[monthName] || [];
    return monthWeeks.reduce((total, week) => {
      return total + getWeekHours(employeeId, week);
    }, 0);
  };

  const formatHours = (hours: number) => 
    `${Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`;
  
  // Quadrant aggregations for yearly view (aggregated entities)
  const emptyQuadrant: QuadrantData = {
    presenca: 0,
    atraso: 0,
    falta: 0,
    faltaJustificada: 0,
    atestado: 0,
  };

  const sumQuadrants = (a: QuadrantData, b: QuadrantData): QuadrantData => ({
    presenca: a.presenca + b.presenca,
    atraso: a.atraso + b.atraso,
    falta: a.falta + b.falta,
    faltaJustificada: a.faltaJustificada + b.faltaJustificada,
    atestado: a.atestado + b.atestado,
  });

  const aggregateWeekQuadrants = (entity: EntityQuadrantData, weekStart: Date): QuadrantData => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    let acc = { ...emptyQuadrant };
    entity.quadrants?.forEach((q, dateStr) => {
      const d = parseISO(dateStr);
      if (d >= weekStart && d <= weekEnd && isSameYear(d, currentDate)) {
        acc = sumQuadrants(acc, q);
      }
    });
    return acc;
  };

  const aggregateMonthQuadrants = (entity: EntityQuadrantData, monthLabel: string): QuadrantData => {
    let acc = { ...emptyQuadrant };
    entity.quadrants?.forEach((q, dateStr) => {
      const d = parseISO(dateStr);
      if (format(d, 'MMM', { locale: ptBR }) === monthLabel && isSameYear(d, currentDate)) {
        acc = sumQuadrants(acc, q);
      }
    });
    return acc;
  };

  const totalColumns = monthNames.length + yearWeeks.length;

  return (
    <div className="calendar-scroll-container overflow-x-auto overflow-y-auto">
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `minmax(250px, 250px) repeat(${totalColumns}, minmax(120px, 120px))`,
          minWidth: `${250 + (totalColumns * 120)}px`
        }}
      >
        {/* Header Row 1: Month names and week labels */}
        <div className="sticky top-0 bg-background border-b p-2 font-medium z-10">
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {monthNames.map((monthName) => (
          <Fragment key={monthName}>
            <div className="bg-muted border-b border-r sticky top-0 z-10">
              <div className="p-2 text-center font-bold border-b text-sm">{monthName}</div>
              <div className="p-2 text-center text-xs">Total</div>
            </div>
            {weeksByMonth[monthName].map((week, weekIndex) => (
              <div key={weekIndex} className="bg-muted border-b border-r sticky top-0 z-10">
                <div className="p-1 text-center font-bold border-b text-xs">
                  S{yearWeeks.indexOf(week) + 1}
                </div>
                <div className="p-1 text-center text-xs">
                  {format(week, 'dd')}-{format(endOfWeek(week, { weekStartsOn: 1 }), 'dd')}
                </div>
              </div>
            ))}
          </Fragment>
        ))}

        {/* Rows - Employee or Aggregated Entities */}
        {isQuadrantMode ? (
          // Quadrant mode - show aggregated entities (simplified for yearly view)
          aggregatedEntities.map(entity => (
            <Fragment key={entity.id}>
              <div className="sticky left-0 bg-background p-2 border-b flex items-center gap-3 z-10">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {entity.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{entity.name}</div>
                  </div>
                </div>
              </div>
              
              {/* Monthly totals and weekly aggregates */}
              {monthNames.map((monthName, monthIndex) => (
                <Fragment key={`${entity.id}-${monthName}`}>
                  {/* Month total - aggregated quadrants */}
                  <div className="min-h-16 p-1 border-b border-r bg-muted/20 flex items-center justify-center">
                    <QuadrantCell data={aggregateMonthQuadrants(entity, monthName)} isMonochrome={isMonochrome} displayMode={displayMode} compact />
                  </div>
                  
                  {/* Week cells - aggregated quadrants per ISO week */}
                  {weeksByMonth[monthName].map((week, weekIndex) => (
                    <div 
                      key={weekIndex} 
                      className="min-h-16 p-1 border-b border-r flex items-center justify-center hover:bg-muted/50"
                    >
                      <QuadrantCell data={aggregateWeekQuadrants(entity, week)} isMonochrome={isMonochrome} displayMode={displayMode} compact />
                    </div>
                  ))}
                </Fragment>
              ))}
            </Fragment>
          ))
        ) : (
          // Normal mode - show employees
          filteredEmployees.map(employee => {
            const yearlyHours = getEmployeeYearlyHours(employee.id);
            
            return (
              <Fragment key={employee.id}>
                <div className="sticky left-0 bg-background p-2 border-b flex items-center gap-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded p-1 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{employee.name}</div>
                          <div className="text-xs text-muted-foreground">{employee.position}</div>
                          <div className="text-xs font-medium text-primary">
                            {formatHours(yearlyHours)}h
                          </div>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Ver Detalhes Anuais</DropdownMenuItem>
                      <DropdownMenuItem>Editar Funcionário</DropdownMenuItem>
                      <DropdownMenuItem>Relatório Anual</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Monthly totals and weekly hours */}
                {monthNames.map((monthName) => (
                  <Fragment key={`${employee.id}-${monthName}`}>
                    {/* Month total */}
                    <div className="min-h-16 p-2 border-b border-r bg-muted/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          {formatHours(getMonthHours(employee.id, monthName))}
                        </div>
                        <div className="text-xs text-muted-foreground">total</div>
                      </div>
                    </div>
                    
                    {/* Week hours */}
                    {weeksByMonth[monthName].map((week, weekIndex) => {
                      const weekHours = getWeekHours(employee.id, week);
                      return (
                        <div 
                          key={weekIndex} 
                          className="min-h-16 p-2 border-b border-r flex items-center justify-center hover:bg-muted/50"
                        >
                          <div className="text-center">
                            <div className="text-sm">
                              {weekHours > 0 ? formatHours(weekHours) : '-'}
                            </div>
                            {weekHours > 0 && (
                              <div className="text-xs text-muted-foreground">h</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}