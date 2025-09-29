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
  eachWeekOfInterval, 
  startOfYear, 
  endOfYear, 
  endOfWeek,
  getYear,
  isSameYear
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface YearlyViewProps {
  currentDate: Date;
  employees: Employee[];
  schedules: Schedule[];
  selectedDepartments: string[];
}

export function YearlyView({ currentDate, employees, schedules, selectedDepartments }: YearlyViewProps) {
  const filteredEmployees = employees.filter(emp => 
    selectedDepartments.length === 0 || selectedDepartments.includes(emp.department)
  );

  const yearWeeks = eachWeekOfInterval(
    { start: startOfYear(currentDate), end: endOfYear(currentDate) },
    { weekStartsOn: 1 }
  );

  // Group weeks by month
  const weeksByMonth: { [key: string]: Date[] } = {};
  const monthNames: string[] = [];
  
  yearWeeks.forEach((week) => {
    const monthKey = format(week, 'MMM', { locale: ptBR });
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

  const totalColumns = monthNames.length + yearWeeks.length;

  return (
    <div className="overflow-auto">
      <div 
        className="grid gap-1 min-w-fit"
        style={{ gridTemplateColumns: `250px repeat(${totalColumns}, minmax(66px, 1fr))` }}
      >
        {/* Header Row 1: Month names and week labels */}
        <div className="sticky top-0 bg-background border-b p-2 font-medium z-10">
          <div>Escalas do Ano</div>
          <div className="text-xs text-muted-foreground mt-1">{format(currentDate, 'yyyy')}</div>
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

        {/* Employee rows */}
        {filteredEmployees.map(employee => {
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
        })}
      </div>
    </div>
  );
}