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
    <div className="h-full overflow-auto">
      <div 
        className="grid overflow-x-auto min-h-0" 
        style={{ 
          gridTemplateColumns: 'minmax(160px, 280px) repeat(24, minmax(56px, 1fr))',
          '--col-fixed': 'minmax(160px, 280px)',
          '--cols': '24',
          '--col-day': 'minmax(56px, 1fr)'
        } as React.CSSProperties}
      >
        {/* Header with hours */}
        <div className="calendar-cell calendar-cell-fixed bg-muted font-semibold sticky top-0 z-20">
          <div className="p-2">
            <div className="hidden md:block">Funcionário</div>
            <div className="md:hidden">Func.</div>
            <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
              {format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
            </div>
          </div>
        </div>
        
        {hours.map(hour => (
          <div key={hour} className="calendar-cell bg-muted text-xs font-medium sticky top-0 z-20 border-b">
            <div className="text-center">
              <span className="hidden sm:inline">{String(hour).padStart(2, '0')}:00</span>
              <span className="sm:hidden">{hour}</span>
            </div>
          </div>
        ))}

        {/* Employee rows */}
        {filteredEmployees.map(employee => {
          const schedule = getScheduleForEmployee(employee.id);
          
          return (
            <Fragment key={employee.id}>
              <div className="calendar-cell calendar-cell-fixed bg-background border-b">
                <div className="flex items-center gap-2 p-2 w-full min-w-0">
                  <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {employee.avatar || employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">
                      <span className="hidden md:inline">{employee.name}</span>
                      <span className="md:hidden">{employee.name.split(' ')[0]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate hidden md:block">{employee.position}</div>
                    <div className="text-xs text-primary truncate hidden md:block">
                      {schedule ? getScheduleDisplay(schedule) : 'Sem escala'}
                    </div>
                  </div>
                </div>
              </div>
              
              {hours.map(hour => {
                const isWorking = schedule && isWorkingHour(hour, schedule);
                
                return (
                  <div 
                    key={`${employee.id}-${hour}`}
                    className={`calendar-cell border-b transition-colors ${
                      isWorking 
                        ? `${getScheduleColor(schedule)}`
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {isWorking ? (
                      <div className="text-center text-xs font-medium">
                        <div className="hidden sm:block">
                          {hour === parseInt(schedule.startTime.split(':')[0]) && schedule.startTime}
                          {hour === parseInt(schedule.endTime.split(':')[0]) - 1 && schedule.endTime}
                        </div>
                        <div className="sm:hidden">●</div>
                      </div>
                    ) : schedule && (schedule.type === 'rest' || schedule.type === 'vacation') ? (
                      <div className={`text-center text-xs ${getScheduleColor(schedule)}`}>
                        {getScheduleDisplay(schedule)}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-muted-foreground hover:bg-muted/30 cursor-pointer">
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