import React from "react";
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
    
    if (start >= 8 && end <= 18) return 'bg-[hsl(var(--schedule-diurno))] text-gray-800';
    if (start >= 13 && end <= 20) return 'bg-[hsl(var(--schedule-vespertino))] text-white';
    if (start >= 20 || end <= 6) return 'bg-[hsl(var(--schedule-noturno))] text-gray-800';
    
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
    <div className="overflow-auto">
      <div className={`grid ${gridCols} gap-1 min-w-fit`}>
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-2 font-medium z-10">
          Funcionário
        </div>
        {dates.map(date => (
          <div 
            key={date.toISOString()} 
            className={`p-2 text-center text-sm font-medium border-b sticky top-0 bg-background z-10 ${
              isToday(date) ? 'bg-[hsl(var(--today))] text-white' : 
              isPastDay(date) ? 'text-[hsl(var(--past-day))]' : 'text-foreground'
            }`}
          >
            <div>{format(date, 'dd')}</div>
            <div className="text-xs">{format(date, 'EEE', { locale: ptBR })}</div>
          </div>
        ))}

        {/* Employee rows */}
        {filteredEmployees.map(employee => (
          <React.Fragment key={employee.id}>
            <div className="sticky left-0 bg-background p-2 border-b flex items-center gap-3 z-10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">{employee.name}</div>
                <div className="text-xs text-muted-foreground">{employee.position}</div>
              </div>
            </div>
            
            {dates.map(date => {
              const schedule = getScheduleForDate(employee.id, date);
              
              return (
                <div 
                  key={`${employee.id}-${date.toISOString()}`}
                  className={`min-h-16 p-1 border-b border-r transition-colors ${
                    isPastDay(date) ? 'opacity-60' : 'hover:bg-muted/50'
                  }`}
                >
                  {schedule ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                          className={`w-full h-full rounded p-1 text-xs cursor-pointer ${getScheduleColor(schedule)}`}
                          title={`${employee.name} - ${format(date, 'dd/MM')}`}
                        >
                          <div className="text-center font-medium">
                            {getScheduleDisplay(schedule)}
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remover</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground hover:bg-muted/30 rounded cursor-pointer">
                      +
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}