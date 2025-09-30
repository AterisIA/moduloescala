import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ViewType } from "@/types/calendar";
import { ViewMode } from "@/types/presence";
import { CalendarNavigation } from "./CalendarNavigation";
import { CalendarViewTabs } from "./CalendarViewTabs";
import { ViewModeFilter } from "./ViewModeFilter";
import { DailyView } from "./DailyView";
import { CalendarGrid } from "./CalendarGrid";
import { MonthlyView } from "./MonthlyView";
import { YearlyView } from "./YearlyView";
import { useEscalas } from "@/hooks/useEscalas";
import { usePresenceStats } from "@/hooks/usePresenceStats";
export function TeamManagement() {
  const {
    employees: escalasEmployees,
    schedules: escalasSchedules,
    loading,
    error
  } = useEscalas();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [viewMode, setViewMode] = useState<ViewMode>('terceirizados');
  const [searchTerm, setSearchTerm] = useState("");
  
  const { entities, loading: statsLoading } = usePresenceStats(viewMode, viewType, currentDate);
  
  const topScrollRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const top = topScrollRef.current;
    const main = mainScrollRef.current;
    if (!top || !main) return;

    const getTarget = () => main.querySelector<HTMLElement>('.calendar-scroll-container');

    let target = getTarget();
    const topContent = top.querySelector<HTMLElement>('.top-scroll-content');

    const updateWidth = () => {
      target = getTarget();
      if (topContent && target) {
        topContent.style.width = `${target.scrollWidth}px`;
      }
    };

    // Initial sync and retries to catch late renders
    const timers = [
      setTimeout(updateWidth, 0),
      setTimeout(updateWidth, 150),
      setTimeout(updateWidth, 400)
    ];

    const onTopScroll = () => {
      target = getTarget();
      if (target && Math.abs(target.scrollLeft - top.scrollLeft) > 1) {
        target.scrollLeft = top.scrollLeft;
      }
    };

    const onTargetScroll = () => {
      target = getTarget();
      if (target && Math.abs(top.scrollLeft - target.scrollLeft) > 1) {
        top.scrollLeft = target.scrollLeft;
      }
    };

    top.addEventListener('scroll', onTopScroll, { passive: true });

    if (target) {
      target.addEventListener('scroll', onTargetScroll, { passive: true });
      target.classList.add('hide-x-scrollbar');
    }

    const ro = new ResizeObserver(updateWidth);
    if (target) ro.observe(target);

    return () => {
      timers.forEach(t => clearTimeout(t));
      top.removeEventListener('scroll', onTopScroll);
      const t = getTarget();
      if (t) {
        t.removeEventListener('scroll', onTargetScroll);
        t.classList.remove('hide-x-scrollbar');
      }
      ro.disconnect();
    };
  }, [viewType, searchTerm, viewMode, currentDate]);
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
  return <div className="calendar-container lg:pl-4">
      {/* Mobile-first sticky header */}
      <header className="calendar-header">
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
              <Input 
                placeholder={viewMode === 'terceirizados' ? "Buscar funcionários..." : "Buscar..."} 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            <ViewModeFilter value={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </header>

      {/* Top horizontal scrollbar */}
      <div 
        ref={topScrollRef}
        className="overflow-x-auto overflow-y-hidden bg-muted/30 border-b"
        style={{ height: '14px' }}
      >
        <div className="top-scroll-content" style={{ height: '1px', minWidth: '100%' }} />
      </div>

      {/* Main content area */}
      <main ref={mainScrollRef} className="calendar-main overflow-y-auto">
        <Card className="border-0 rounded-none">
          <CardContent className="p-0">
            {/* Calendar Views */}
            {viewType === 'daily' && (
              <DailyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={escalasSchedules} 
                viewMode={viewMode}
                entities={entities}
              />
            )}
            
            {viewType === 'weekly' && (
              <CalendarGrid 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={escalasSchedules} 
                viewType={viewType}
                viewMode={viewMode}
                entities={entities}
              />
            )}
            
            {viewType === 'monthly' && (
              <MonthlyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={escalasSchedules}
                viewMode={viewMode}
                entities={entities}
              />
            )}
            
            {viewType === 'yearly' && (
              <YearlyView 
                currentDate={currentDate} 
                employees={filteredEmployees} 
                schedules={escalasSchedules}
                viewMode={viewMode}
                entities={entities}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer with safe area for mobile */}
      <footer className="safe-bottom p-4 border-t bg-background">
        
      </footer>
    </div>;
}