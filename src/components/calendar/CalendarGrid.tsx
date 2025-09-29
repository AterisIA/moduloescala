import React, { Fragment } from "react";
import { Employee, Schedule, ViewType } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, addDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface CalendarGridProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
  viewType: ViewType;
}

export function CalendarGrid({ currentDate, employees, schedules, selectedDepartments, viewType }: CalendarGridProps) {
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
    if (schedule.type === 'vacation') return 'bg-orange-100 text-orange-800';
    
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    
    if (start >= 8 && end <= 18) return 'bg-[hsl(var(--schedule-diurno))] text-white';
    if (start >= 13 && end <= 20) return 'bg-[hsl(var(--schedule-vespertino))] text-white';
    if (start >= 20 || end <= 6) return 'bg-[hsl(var(--schedule-noturno))] text-white';
    
    return 'bg-gray-200 text-gray-800';
  };

  const getScheduleDisplay = (schedule: Schedule) => {
    if (schedule.type === 'rest') return '💤';
    if (schedule.type === 'vacation') return '🏖️';
    return `${schedule.startTime}-${schedule.endTime}`;
  };

  const isPastDay = (date: Date) => date < today;
  const isToday = (date: Date) => isSameDay(date, today);

  const gridCols = viewType === 'weekly' ? 'grid-cols-8' : 'grid-cols-8';

  return (
    <div className="h-full overflow-auto">
      <div 
        className="grid overflow-x-auto min-h-0" 
        style={{ 
          gridTemplateColumns: viewType === 'weekly' 
            ? 'minmax(160px, 280px) repeat(7, minmax(80px, 1fr))'
            : 'minmax(160px, 280px) repeat(auto-fit, minmax(32px, 1fr))',
          '--col-fixed': 'minmax(160px, 280px)',
          '--cols': viewType === 'weekly' ? '7' : dates.length.toString(),
          '--col-day': viewType === 'weekly' ? 'minmax(80px, 1fr)' : 'minmax(32px, 1fr)'
        } as React.CSSProperties}
      >
        {/* Header with dates */}
        <div className="calendar-cell calendar-cell-fixed bg-muted font-semibold sticky top-0 z-20 border-b">
          <div className="p-2">
            <span className="hidden md:inline">Escalas da Semana</span>
            <span className="md:hidden">Escalas</span>
          </div>
        </div>
        {dates.map(date => (
          <div 
            key={date.toISOString()} 
            className={`calendar-cell bg-muted text-xs font-medium sticky top-0 z-20 border-b ${
              isToday(date) ? 'bg-[hsl(var(--today))] text-white' : 
              isPastDay(date) ? 'text-[hsl(var(--past-day))]' : 'text-foreground'
            }`}
          >
            <div className="text-center p-1">
              <div className="font-bold">{format(date, 'dd')}</div>
              <div className="text-xs hidden sm:block">{format(date, 'EEE', { locale: ptBR })}</div>
            </div>
          </div>
        ))}

        {/* Employee rows */}
        {filteredEmployees.map(employee => (
          <Fragment key={employee.id}>
            <div className="calendar-cell calendar-cell-fixed bg-background border-b">
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
        ))}
      </div>
    </div>
  );
}