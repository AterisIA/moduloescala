import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { ViewType } from "@/types/calendar";
import { CalendarNavigation } from "./CalendarNavigation";
import { CalendarViewTabs } from "./CalendarViewTabs";

import { DailyView } from "./DailyView";
import { CalendarGrid } from "./CalendarGrid";
import { MonthlyView } from "./MonthlyView";
import { YearlyView } from "./YearlyView";
import { useEscalas } from "@/hooks/useEscalas";
export function TeamManagement() {
  const {
    employees: escalasEmployees,
    schedules: escalasSchedules,
    loading,
    error
  } = useEscalas();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const departments = ["Terceirizados", "Coordenadores", "Plantões", "Empresas"];
  const handleNavigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        if (viewType === 'daily') {
          newDate.setDate(prev.getDate() - 1);
        } else if (viewType === 'weekly') {
          newDate.setDate(prev.getDate() - 7);
        } else if (viewType === 'monthly') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setFullYear(prev.getFullYear() - 1);
        }
      } else {
        if (viewType === 'daily') {
          newDate.setDate(prev.getDate() + 1);
        } else if (viewType === 'weekly') {
          newDate.setDate(prev.getDate() + 7);
        } else if (viewType === 'monthly') {
          newDate.setMonth(prev.getMonth() + 1);
        } else {
          newDate.setFullYear(prev.getFullYear() + 1);
        }
      }
      return newDate;
    });
  };
  const handleDepartmentFilter = (department: string) => {
    setSelectedDepartment(department);
  };
  const filteredEmployees = escalasEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  if (loading) {
    return <div className="calendar-container lg:pl-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando escalas...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="calendar-container lg:pl-4 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Erro ao carregar escalas:</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>;
  }
  return <div className="calendar-container lg:pl-4 h-screen flex flex-col">
      {/* Mobile-first sticky header */}
      <header className="calendar-header flex-shrink-0">
        <div className="p-4 space-y-4">
          {/* Navigation and View Controls */}
          <div className="flex items-center justify-between">
            <CalendarNavigation currentDate={currentDate} onNavigate={handleNavigate} viewType={viewType} />
          </div>

          {/* View Tabs - scrollable on mobile */}
          <div className="calendar-tabs">
            <CalendarViewTabs viewType={viewType} onViewChange={setViewType} />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar funcionários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            {/* Mobile: show filter button, Desktop: show select */}
            <div className="sm:hidden">
              <Select value={selectedDepartment} onValueChange={handleDepartmentFilter}>
                <SelectTrigger className="w-full touch-target">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:block">
              <Select value={selectedDepartment} onValueChange={handleDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with fixed height */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <Card className="h-full border-0 rounded-none">
          <CardContent className="p-0 h-full">
            {/* Calendar Views */}
            {viewType === 'daily' && <DailyView currentDate={currentDate} employees={filteredEmployees} schedules={escalasSchedules} selectedDepartments={selectedDepartment === "all" ? [] : [selectedDepartment]} />}
            
            {viewType === 'weekly' && <CalendarGrid currentDate={currentDate} employees={filteredEmployees} schedules={escalasSchedules} selectedDepartments={selectedDepartment === "all" ? [] : [selectedDepartment]} viewType={viewType} />}
            
            {viewType === 'monthly' && <MonthlyView currentDate={currentDate} employees={filteredEmployees} schedules={escalasSchedules} selectedDepartments={selectedDepartment === "all" ? [] : [selectedDepartment]} />}
            
            {viewType === 'yearly' && <YearlyView currentDate={currentDate} employees={filteredEmployees} schedules={escalasSchedules} selectedDepartments={selectedDepartment === "all" ? [] : [selectedDepartment]} />}
          </CardContent>
        </Card>
      </main>

      {/* Footer with safe area for mobile */}
      <footer className="safe-bottom p-4 border-t bg-background">
        
      </footer>
    </div>;
}