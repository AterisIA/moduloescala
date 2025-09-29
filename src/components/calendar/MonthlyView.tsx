import React, { Fragment } from "react";
import { Employee, Schedule } from "@/types/calendar";
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

interface MonthlyViewProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
}

export function MonthlyView({ currentDate, employees, schedules, selectedDepartments }: MonthlyViewProps) {
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
      schedule.startDateTime &&
      (isSameDay(schedule.startDateTime, date) || 
       (schedule.endDateTime && schedule.startDateTime <= date && date <= schedule.endDateTime))
    );
  };

  const getScheduleIndicator = (schedule: Schedule) => {
    if (!schedule.startDateTime) return <div className="w-2 h-2 rounded-full bg-gray-300" />;
    
    const hour = schedule.startDateTime.getHours();
    
    if (hour >= 6 && hour < 14) {
      return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-diurno))]" />;
    } else if (hour >= 14 && hour < 22) {
      return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-vespertino))]" />;
    } else {
      return <div className="w-2 h-2 rounded-full bg-[hsl(var(--schedule-noturno))]" />;
    }
  };

  const calculateHours = (schedule: Schedule): number => {
    if (!schedule.startDateTime || !schedule.endDateTime) return 0;
    
    const diffInMs = schedule.endDateTime.getTime() - schedule.startDateTime.getTime();
    return diffInMs / (1000 * 60 * 60); // Convert to hours
  };

  const getMonthlyHours = (employeeId: string): number => {
    return schedules
      .filter(s => s.employeeId === employeeId && 
        s.startDateTime && isSameMonth(s.startDateTime, currentDate))
      .reduce((total, schedule) => total + calculateHours(schedule), 0);
  };

  // Função para detectar se uma escala atravessa múltiplos dias no mês
  const getScheduleSpan = (schedule: Schedule, currentDate: Date) => {
    if (!schedule.startDateTime || !schedule.endDateTime) return { isStart: true, isEnd: true, isMiddle: false };
    
    const scheduleStartDate = new Date(schedule.startDateTime.toDateString());
    const scheduleEndDate = new Date(schedule.endDateTime.toDateString());
    const checkDate = new Date(currentDate.toDateString());
    
    const isStart = isSameDay(checkDate, scheduleStartDate);
    const isEnd = isSameDay(checkDate, scheduleEndDate);
    const isMiddle = !isStart && !isEnd && checkDate > scheduleStartDate && checkDate < scheduleEndDate;
    
    return { isStart, isEnd, isMiddle };
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
    <div className="overflow-auto">
      <div 
        className="grid gap-1 min-w-fit"
        style={{ gridTemplateColumns: `250px repeat(${monthDays.length}, minmax(60px, 1fr))` }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-2 font-medium z-10">
          <div>Funcionário</div>
          <div className="text-xs text-muted-foreground mt-1">Horas/Mês</div>
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

        {/* Employee rows */}
        {filteredEmployees.map(employee => {
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
                        <div className="text-xs font-medium text-primary">
                          {formatHours(monthlyHours)}h
                        </div>
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
                const span = schedule ? getScheduleSpan(schedule, date) : null;
                
                return (
                  <div 
                    key={`${employee.id}-${date.toISOString()}`}
                    className={`min-h-16 p-2 border-b border-r transition-colors flex items-center justify-center ${
                      isPast(date) ? 'opacity-60' : 'hover:bg-muted/50'
                    } ${getDayClass(date)} ${
                      schedule && span ? (span.isStart ? 'rounded-l' : '') + 
                      (span.isEnd ? ' rounded-r' : '') + 
                      (span.isMiddle ? ' bg-opacity-30' : '') : ''
                    }`}
                  >
                    {schedule && span ? (
                      <div className="flex flex-col items-center gap-1">
                        {getScheduleIndicator(schedule)}
                        <div className="text-xs text-center">
                          {span.isStart && schedule.startDateTime ? 
                            `${schedule.startDateTime.toTimeString().substring(0, 5)}` : ''}
                          {span.isMiddle ? '●' : ''}
                          {span.isEnd && schedule.endDateTime ? 
                            `${schedule.endDateTime.toTimeString().substring(0, 5)}` : ''}
                        </div>
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
        })}
      </div>
    </div>
  );
}