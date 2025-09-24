import React, { Fragment } from "react";
import { Employee, Schedule } from "@/types/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, isSameDay } from "date-fns";
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
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  // Generate hours from 00 to 23
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getScheduleForEmployee = (employeeId: string) => {
    return schedules.find(schedule => 
      schedule.employeeId === employeeId && 
      isSameDay(schedule.date, currentDate)
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

  const isWorkingHour = (hour: number, schedule: Schedule) => {
    if (!schedule || schedule.type !== 'work') return false;
    const start = parseInt(schedule.startTime.split(':')[0]);
    const end = parseInt(schedule.endTime.split(':')[0]);
    return hour >= start && hour < end;
  };

  return (
    <div className="overflow-auto">
      <div 
        className="grid gap-1 min-w-fit"
        style={{ gridTemplateColumns: `280px repeat(24, minmax(50px, 1fr))` }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-2 font-medium z-10">
          <div>Funcionário</div>
          <div className="text-xs text-muted-foreground mt-1">
            {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
          </div>
        </div>
        
        {hours.map(hour => (
          <div 
            key={hour} 
            className="p-2 text-center text-sm font-medium border-b sticky top-0 bg-background z-10"
          >
            <div>{String(hour).padStart(2, '0')}h</div>
          </div>
        ))}

        {/* Employee rows */}
        {filteredEmployees.map(employee => {
          const schedule = getScheduleForEmployee(employee.id);
          
          return (
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
                  <div className="text-xs text-primary">
                    {schedule ? getScheduleDisplay(schedule) : 'Sem escala'}
                  </div>
                </div>
              </div>
              
              {hours.map(hour => {
                const isWorking = schedule && isWorkingHour(hour, schedule);
                
                return (
                  <div 
                    key={`${employee.id}-${hour}`}
                    className={`min-h-16 p-1 border-b border-r transition-colors ${
                      isWorking 
                        ? `${getScheduleColor(schedule)} opacity-80`
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {isWorking ? (
                      <div className="w-full h-full rounded p-1 text-xs">
                        <div className="text-center font-medium">
                          {hour === parseInt(schedule.startTime.split(':')[0]) && schedule.startTime}
                          {hour === parseInt(schedule.endTime.split(':')[0]) - 1 && schedule.endTime}
                        </div>
                      </div>
                    ) : schedule && (schedule.type === 'rest' || schedule.type === 'vacation') ? (
                      <div className={`w-full h-full rounded p-1 text-xs text-center ${getScheduleColor(schedule)}`}>
                        {getScheduleDisplay(schedule)}
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