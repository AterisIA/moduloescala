import React, { Fragment } from "react";
import { Employee, Schedule, ViewType, EntityQuadrantData } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, addDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { QuadrantCell } from "./QuadrantCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CalendarGridProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
  viewType: ViewType;
  isQuadrantMode?: boolean;
  aggregatedEntities?: EntityQuadrantData[];
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
  isMonochrome?: boolean;
  displayMode?: 'absolute' | 'percentage' | 'hours';
}

export function CalendarGrid({ currentDate, employees, schedules, selectedDepartments, viewType, isQuadrantMode = false, aggregatedEntities = [], selectedDepartment, onDepartmentChange, departments, isMonochrome = false, displayMode = 'absolute' }: CalendarGridProps) {
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  const getDateRange = () => {
    if (viewType === 'weekly') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const startWeek = startOfWeek(start, { weekStartsOn: 1 });
      const endWeek = endOfWeek(end, { weekStartsOn: 1 });
      
      const dates = [];
      let current = startWeek;
      while (current <= endWeek) {
        dates.push(current);
        current = addDays(current, 1);
      }
      return dates;
    }
  };

  const dates = getDateRange();
  const today = new Date();

  const getScheduleForDate = (employeeId: string, date: Date) => {
    return schedules.find(schedule => 
      schedule.employeeId === employeeId && 
      isSameDay(schedule.date, date)
    );
  };

  const getScheduleColor = (schedule: Schedule) => {
    if (schedule.type === 'rest') return 'bg-muted text-muted-foreground';
    if (schedule.type === 'break') return 'bg-blue-100 text-blue-800'; // Banco de horas
    if (schedule.type === 'vacation') return 'bg-orange-100 text-orange-800';
    
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    
    if (start >= 8 && end <= 18) return 'bg-[hsl(var(--schedule-diurno))] text-white';
    if (start >= 13 && end <= 20) return 'bg-[hsl(var(--schedule-vespertino))] text-white';
    if (start >= 20 || end <= 6) return 'bg-[hsl(var(--schedule-noturno))] text-white';
    
    return 'bg-gray-200 text-gray-800';
  };

  const getScheduleDisplay = (schedule: Schedule) => {
    if (schedule.type === 'rest') return '😴';
    if (schedule.type === 'break') return '⏰'; // Banco de horas
    if (schedule.type === 'vacation') return '🏖️';
    return `${schedule.startTime}-${schedule.endTime}`;
  };

  const isPastDay = (date: Date) => date < today;
  const isToday = (date: Date) => isSameDay(date, today);

  const gridCols = viewType === 'weekly' ? 'grid-cols-8' : 'grid-cols-8';

  return (
    <div className="h-full">
      <div className="calendar-scroll-container overflow-x-auto">
        <div 
          className="grid" 
          style={{ 
            gridTemplateColumns: `minmax(160px, 280px) repeat(7, minmax(${isQuadrantMode ? '160px' : '120px'}, ${isQuadrantMode ? '160px' : '120px'}))`,
            '--col-fixed': 'minmax(160px, 280px)',
            '--cols': '7',
            '--col-day': `minmax(${isQuadrantMode ? '160px' : '120px'}, ${isQuadrantMode ? '160px' : '120px'})`,
            minWidth: `${280 + (7 * (isQuadrantMode ? 160 : 120))}px`
          } as React.CSSProperties}
        >
        {/* Header with dates */}
        <div className="cal-first-col cal-header--week bg-muted font-semibold sticky top-0 left-0 z-30 border-b border-r">
          <div className="p-2">
            <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
              <SelectTrigger className="w-full h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {dates.map(date => (
          <div 
            key={date.toISOString()} 
            className={`cal-header--week bg-muted text-xs font-medium sticky top-0 z-20 border-b border-r ${
              isToday(date) ? 'bg-primary text-primary-foreground' : 
              isPastDay(date) ? 'text-[hsl(var(--past-day))]' : 'text-foreground'
            }`}
          >
            <div className="text-center p-1">
              <div className="font-bold">{format(date, 'dd')}</div>
              <div className="text-xs hidden sm:block">{format(date, 'EEE', { locale: ptBR })}</div>
            </div>
          </div>
        ))}

        {/* Rows - Employee or Aggregated Entities */}
        {isQuadrantMode ? (
          // Quadrant mode - show aggregated entities
          aggregatedEntities.map(entity => (
            <Fragment key={entity.id}>
              <div className="cal-first-col bg-background border-b border-r sticky left-0 z-10">
                <div className="flex items-center gap-2 p-2 w-full min-w-0">
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {entity.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs md:text-sm truncate">
                      {entity.name}
                    </div>
                  </div>
                </div>
              </div>
              
              {dates.map(date => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const quadrant = entity.quadrants.get(dateKey) || {
                  presenca: 0,
                  atraso: 0,
                  falta: 0,
                  faltaJustificada: 0,
                  atestado: 0
                };
                
                  return (
                    <div 
                      key={`${entity.id}-${date.toISOString()}`}
                      className="calendar-cell border-b p-1"
                    >
                      <QuadrantCell data={quadrant} isMonochrome={isMonochrome} displayMode={displayMode} />
                    </div>
                  );
              })}
            </Fragment>
          ))
        ) : (
          // Normal mode - show employees
          filteredEmployees.map(employee => (
            <Fragment key={employee.id}>
              <div className="cal-first-col bg-background border-b border-r sticky left-0 z-10">
                <div className="flex items-center gap-2 p-2 w-full min-w-0">
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs md:text-sm truncate">
                      {employee.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate hidden sm:block">{employee.position}</div>
                  </div>
                </div>
              </div>
              
              {dates.map(date => {
                const schedule = getScheduleForDate(employee.id, date);
                
                return (
                  <div 
                    key={`${employee.id}-${date.toISOString()}`}
                    className={`calendar-cell border-b cursor-pointer transition-colors ${
                      isPastDay(date) ? 'opacity-60' : 'hover:bg-muted/50'
                    }`}
                  >
                    {schedule ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div 
                            className={`w-full h-full flex items-center justify-center text-xs cursor-pointer ${getScheduleColor(schedule)}`}
                            title={`${employee.name} - ${format(date, 'dd/MM')}`}
                          >
                            <div className="text-center font-medium">
                              <span className="hidden sm:inline">{getScheduleDisplay(schedule)}</span>
                              <span className="sm:hidden">●</span>
                            </div>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer">
                        +
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))
        )}
        </div>
      </div>
    </div>
  );
}