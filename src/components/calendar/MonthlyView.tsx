import React, { Fragment } from "react";
import { Employee, Schedule, EntityQuadrantData } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  format, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isToday, 
  isPast, 
  isSameMonth,
  isSameDay 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { QuadrantCell } from "./QuadrantCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonthlyViewProps {
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

export function MonthlyView({ currentDate, employees, schedules, selectedDepartments, isQuadrantMode = false, aggregatedEntities = [], selectedDepartment, onDepartmentChange, departments, isMonochrome = false, displayMode = 'absolute' }: MonthlyViewProps) {
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  const monthDays = eachDayOfInterval({ 
    start: startOfMonth(currentDate), 
    end: endOfMonth(currentDate) 
  });

  const getScheduleForDate = (employeeId: string, date: Date) => {
    return schedules.find(schedule => 
      schedule.employeeId === employeeId && 
      isSameDay(schedule.date, date)
    );
  };

  const getScheduleIndicator = (schedule: Schedule) => {
    switch (schedule.type) {
      case 'work': 
        return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-red))]" />;
      case 'rest': 
        return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-gray))]" />;
      case 'vacation': 
        return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-blue))]" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-red))]" />;
    }
  };

  const calculateHours = (schedule: Schedule): number => {
    if (schedule.type !== 'work') return 0;
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    return ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
  };

  const getMonthlyHours = (employeeId: string): number => {
    return schedules
      .filter(s => s.employeeId === employeeId && isSameMonth(s.date, currentDate))
      .reduce((total, schedule) => total + calculateHours(schedule), 0);
  };

  const getDayClass = (date: Date) => {
    if (isToday(date)) return 'bg-[hsl(var(--today-bg)/0.2)] border-[hsl(var(--today))] text-[hsl(var(--today))]';
    if (isPast(date)) return 'text-[hsl(var(--past-day))] bg-muted/20';
    if (!isSameMonth(date, currentDate)) return 'text-muted-foreground bg-muted/10';
    return 'text-foreground';
  };

  const formatHours = (hours: number) => 
    `${Math.floor(hours)}:${String(Math.round((hours % 1) * 60)).padStart(2, '0')}`;

  return (
    <div className="calendar-scroll-container overflow-x-auto overflow-y-auto">
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `minmax(250px, 250px) repeat(${monthDays.length}, minmax(${isQuadrantMode ? '120px' : '65px'}, 1fr))`,
          minWidth: 'max-content'
        }}
      >
        {/* Header */}
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
        
        {monthDays.map(date => (
          <div 
            key={date.toISOString()} 
            className={`p-2 text-center text-sm font-medium border-b sticky top-0 bg-background z-10 ${getDayClass(date)}`}
          >
            <div>{format(date, 'dd')}</div>
            <div className="text-xs">{format(date, 'EEE', { locale: ptBR })}</div>
          </div>
        ))}

        {/* Rows - Employee or Aggregated Entities */}
        {isQuadrantMode ? (
          // Quadrant mode - show aggregated entities
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
              
              {monthDays.map(date => {
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
                      className={`min-h-16 p-1 border-b border-r ${getDayClass(date)}`}
                    >
                      <QuadrantCell data={quadrant} isMonochrome={isMonochrome} displayMode={displayMode} />
                    </div>
                  );
              })}
            </Fragment>
          ))
        ) : (
          // Normal mode - show employees
          filteredEmployees.map(employee => {
            const monthlyHours = getMonthlyHours(employee.id);
            
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
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem>Editar Funcionário</DropdownMenuItem>
                      <DropdownMenuItem>Relatório Mensal</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {monthDays.map(date => {
                  const schedule = getScheduleForDate(employee.id, date);
                  const isWorking = schedule?.type === 'work';
                  
                  return (
                    <div 
                      key={`${employee.id}-${date.toISOString()}`}
                      className={`min-h-16 p-2 border-b border-r transition-colors flex items-center justify-center ${
                        isPast(date) ? 'opacity-60' : ''
                      } ${
                        isWorking 
                          ? 'bg-[hsl(var(--schedule-red)/0.3)] hover:bg-[hsl(var(--schedule-red)/0.4)]'
                          : schedule?.type === 'rest'
                          ? 'bg-[hsl(var(--schedule-gray)/0.3)]'
                          : schedule?.type === 'vacation'
                          ? 'bg-[hsl(var(--schedule-blue)/0.3)]'
                          : 'hover:bg-muted/50'
                      } ${getDayClass(date)}`}
                    >
                      {schedule ? (
                        <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full text-center">
                          {schedule.type === 'work' ? (
                            <div className="text-[11px] font-medium leading-tight">
                              {schedule.startTime.slice(0,5)}-{schedule.endTime.slice(0,5)}
                            </div>
                          ) : (
                            <div className="text-lg">
                              {schedule.type === 'rest' ? '💤' : '🏖️'}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/30 rounded cursor-pointer">
                          +
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}