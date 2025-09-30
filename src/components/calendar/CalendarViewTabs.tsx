import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { ViewType } from "@/types/calendar";

interface CalendarViewTabsProps {
  viewType: ViewType;
  onViewChange: (view: ViewType) => void;
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  departments: string[];
}

export function CalendarViewTabs({ 
  viewType, 
  onViewChange, 
  selectedDepartment, 
  onDepartmentChange,
  departments 
}: CalendarViewTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <Tabs value={viewType} onValueChange={(value) => onViewChange(value as ViewType)} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="daily" className="calendar-tab">Dia</TabsTrigger>
          <TabsTrigger value="weekly" className="calendar-tab">Semana</TabsTrigger>
          <TabsTrigger value="monthly" className="calendar-tab">Mês</TabsTrigger>
          <TabsTrigger value="yearly" className="calendar-tab">Ano</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-full sm:w-48">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {departments.map(dept => (
            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}