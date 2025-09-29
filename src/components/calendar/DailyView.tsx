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
      schedule.startDateTime && 
      isSameDay(schedule.startDateTime, currentDate)
    );
  };

  const getScheduleColor = (schedule: Schedule) => {
    if (!schedule.startDateTime) return 'bg-gray-200 text-gray-800';
    
    const hour = schedule.startDateTime.getHours();
    
    if (hour >= 6 && hour < 14) {
      return 'bg-[hsl(var(--schedule-diurno))] text-white';
    } else if (hour >= 14 && hour < 22) {
      return 'bg-[hsl(var(--schedule-vespertino))] text-white';
    } else {
      return 'bg-[hsl(var(--schedule-noturno))] text-white';
    }
  };

  const getScheduleDisplay = (schedule: Schedule) => {
    if (!schedule.startDateTime || !schedule.endDateTime) return schedule.startTime;
    
    const start = schedule.startDateTime.toTimeString().substring(0, 5);
    const end = schedule.endDateTime.toTimeString().substring(0, 5);
    return `${start} - ${end}`;
  };

  const calculateBlockPosition = (schedule: Schedule) => {
    if (!schedule.startDateTime || !schedule.endDateTime) return { left: 0, width: 0 };
    
    const startHour = schedule.startDateTime.getHours() + schedule.startDateTime.getMinutes() / 60;
    const endHour = schedule.endDateTime.getHours() + schedule.endDateTime.getMinutes() / 60;
    
    // Se a escala vai até o dia seguinte
    const duration = endHour <= startHour ? (24 - startHour) + endHour : endHour - startHour;
    
    const left = (startHour / 24) * 100;
    const width = (duration / 24) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const isWithinSchedule = (hour: number, schedule: Schedule) => {
    if (!schedule || !schedule.startDateTime || !schedule.endDateTime) return false;
    
    const startHour = schedule.startDateTime.getHours();
    const endHour = schedule.endDateTime.getHours();
    
    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // Escala noturna que passa para o próximo dia
      return hour >= startHour || hour < endHour;
    }
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
                    <div className="font-medium text-xs md:text-sm truncate">
                      {employee.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate hidden sm:block">{employee.position}</div>
                    <div className="text-xs text-primary truncate hidden lg:block">
                      {schedule ? getScheduleDisplay(schedule) : 'Sem escala'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Schedule display area - using full width for proportional blocks */}
              <div className="col-span-24 relative min-h-[60px] border-b bg-gray-50">
                {schedule ? (
                  <div 
                    className={`absolute top-1 bottom-1 ${getScheduleColor(schedule)} 
                      rounded px-2 py-1 text-xs font-medium flex items-center justify-center z-10 shadow-sm`}
                    style={calculateBlockPosition(schedule)}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{getScheduleDisplay(schedule)}</div>
                      <div className="text-xs opacity-90">{employee.name}</div>
                    </div>
                  </div>
                ) : (
                  // Grid de horas para quando não há escala
                  <div className="grid grid-cols-24 h-full">
                    {hours.map(hour => (
                      <div
                        key={hour}
                        className="border-r border-gray-200 flex items-center justify-center text-gray-400 text-xs hover:bg-gray-100 cursor-pointer"
                        title={`Adicionar escala para ${String(hour).padStart(2, '0')}:00`}
                      >
                        +
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}