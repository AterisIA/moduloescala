import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { ViewType } from "@/types/calendar";
import { CalendarNavigation } from "./CalendarNavigation";
import { CalendarViewTabs } from "./CalendarViewTabs";
import { SelectedChipsBar } from "./SelectedChipsBar";
import { DailyView } from "./DailyView";
import { CalendarGrid } from "./CalendarGrid";
import { MonthlyView } from "./MonthlyView";
import { YearlyView } from "./YearlyView";
import { mockEmployees, mockSchedules } from "@/data/mockData";
export function TeamManagement() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
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
    if (department === "all") {
      setSelectedDepartments([]);
      setFilterDepartment("all");
    } else {
      if (!selectedDepartments.includes(department)) {
        setSelectedDepartments([...selectedDepartments, department]);
      }
      setFilterDepartment("all");
    }
  };
  const handleRemoveDepartment = (department: string) => {
    setSelectedDepartments(prev => prev.filter(d => d !== department));
  };
  const handleClearAllFilters = () => {
    setSelectedDepartments([]);
    setFilterDepartment("all");
  };
  const filteredEmployees = mockEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  return (
    <div className="calendar-container">
      {/* Mobile-first sticky header */}
      <header className="calendar-header">
        <div className="p-4 space-y-4">
          {/* Navigation and View Controls */}
          <div className="flex items-center justify-between">
            <CalendarNavigation 
              currentDate={currentDate} 
              onNavigate={handleNavigate} 
              viewType={viewType} 
            />
          </div>

          {/* View Tabs - scrollable on mobile */}
          <div className="calendar-tabs">
            <CalendarViewTabs viewType={viewType} onViewChange={setViewType} />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar funcionários..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            {/* Mobile: show filter button, Desktop: show select */}
            <div className="sm:hidden">
              <Select value={filterDepartment} onValueChange={handleDepartmentFilter}>
                <SelectTrigger className="w-full touch-target">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:block">
              <Select value={filterDepartment} onValueChange={handleDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Chips */}
          <SelectedChipsBar 
            selectedDepartments={selectedDepartments} 
            onRemoveDepartment={handleRemoveDepartment} 
            onClearAll={handleClearAllFilters} 
          />
        </div>
      </header>

      {/* Main content area */}
      <main className="calendar-main">
        <Card className="h-full border-0 rounded-none">
          <CardContent className="p-0 h-full overflow-auto">
            {/* Calendar Views */}
            {viewType === 'daily' && (
              <DailyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={mockSchedules} 
                selectedDepartments={selectedDepartments} 
              />
            )}
            
            {viewType === 'weekly' && (
              <CalendarGrid 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={mockSchedules} 
                selectedDepartments={selectedDepartments} 
                viewType={viewType} 
              />
            )}
            
            {viewType === 'monthly' && (
              <MonthlyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={mockSchedules} 
                selectedDepartments={selectedDepartments} 
              />
            )}
            
            {viewType === 'yearly' && (
              <YearlyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={mockSchedules} 
                selectedDepartments={selectedDepartments} 
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer with safe area for mobile */}
      <footer className="safe-bottom p-4 border-t bg-background">
        <Card className="p-3">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--schedule-diurno))]"></div>
              <span>Diurno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--schedule-vespertino))]"></div>
              <span>Vespertino</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--schedule-noturno))]"></div>
              <span>Noturno</span>
            </div>
          </div>
        </Card>
      </footer>
    </div>
  );
}