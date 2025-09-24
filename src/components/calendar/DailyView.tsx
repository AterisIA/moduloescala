import React, { Fragment } from "react";
import { Employee, Schedule } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, getDaysInMonth, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface DailyViewProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
}

export function DailyView({ currentDate, employees, schedules, selectedDepartments }: DailyViewProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = startOfMonth(currentDate);
  const today = new Date();
  
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  const getScheduleForDate = (employeeId: string, day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return schedules.find(schedule => 
      schedule.employeeId === employeeId && 
      schedule.date.toDateString() === targetDate.toDateString()
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

  const getShiftName = (schedule: Schedule) => {
    if (schedule.type === 'rest') return 'Folga';
    if (schedule.type === 'vacation') return 'Férias';
    
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    
    if (start >= 8 && end <= 18) return 'Diurno';
    if (start >= 13 && end <= 20) return 'Vespertino';
    if (start >= 20 || end <= 6) return 'Noturno';
    
    return 'Personalizado';
  };

  const isPastDay = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dayDate < today;
  };

  const isToday = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dayDate.toDateString() === today.toDateString();
  };

  return (
    <div className="overflow-x-auto">
      <div 
        className="grid gap-1 min-w-fit"
        style={{
          gridTemplateColumns: `280px repeat(${daysInMonth}, minmax(50px, 1fr))`
        }}
      >
        {/* Header */}
        <div className="sticky left-0 bg-background border-b p-2 font-medium z-10">
          Funcionário
        </div>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <div 
            key={day} 
            className={`p-2 text-center text-sm font-medium border-b ${
              isToday(day) ? 'bg-[hsl(var(--today))] text-white' : 
              isPastDay(day) ? 'text-[hsl(var(--past-day))]' : 'text-foreground'
            }`}
          >
            {day}
          </div>
        ))}

        {/* Employee rows */}
        {filteredEmployees.map(employee => (
          <Fragment key={employee.id}>
            <div className="sticky left-0 bg-background p-2 border-b flex items-center gap-3 z-10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-sm">{employee.name}</div>
                <div className="text-xs text-muted-foreground">{employee.position}</div>
                <div className="text-xs text-muted-foreground">{employee.weeklyHours}h/sem</div>
              </div>
            </div>
            
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const schedule = getScheduleForDate(employee.id, day);
              
              return (
                <div 
                  key={`${employee.id}-${day}`}
                  className={`min-h-16 p-1 border-b border-r transition-colors ${
                    isPastDay(day) ? 'opacity-60' : 'hover:bg-muted/50'
                  }`}
                >
                  {schedule ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div 
                          className={`w-full h-full rounded p-1 text-xs cursor-pointer ${getScheduleColor(schedule)}`}
                          title={`${employee.name} - ${getShiftName(schedule)}`}
                        >
                          <div className="text-center font-medium">
                            {getScheduleDisplay(schedule)}
                          </div>
                          <div className="text-center text-xs opacity-75">
                            {getShiftName(schedule)}
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
                      + Adicionar
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