import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { Search, Palette, Hash, Percent, Clock } from "lucide-react";
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
    error,
    fetchAggregatedData
  } = useEscalas();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDepartment, setSelectedDepartment] = useState<string>("Terceirizados");
  const [searchTerm, setSearchTerm] = useState("");
  const [aggregatedEntities, setAggregatedEntities] = useState<any[]>([]);
  const [loadingAggregated, setLoadingAggregated] = useState(false);
  const [isMonochrome, setIsMonochrome] = useState(false);
  const [displayMode, setDisplayMode] = useState<'absolute' | 'percentage' | 'hours'>('absolute');
  const departments = ["Terceirizados", "Coordenadores", "Plantões", "Empresas"];
  
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
        // Match the exact scrollable width of the target to keep ranges equal
        const scrollWidth = Math.max(target.scrollWidth, target.clientWidth);
        topContent.style.width = `${scrollWidth}px`;
      }
    };

    const syncFromTop = () => {
      target = getTarget();
      if (!target) return;
      const topMax = Math.max(0, top.scrollWidth - top.clientWidth);
      const tgtMax = Math.max(0, target.scrollWidth - target.clientWidth);
      if (topMax === 0 || tgtMax === 0) return;
      const ratio = top.scrollLeft / topMax;
      const desired = ratio * tgtMax;
      if (Math.abs(target.scrollLeft - desired) > 1) {
        target.scrollLeft = desired;
      }
    };

    const syncFromTarget = () => {
      target = getTarget();
      if (!target) return;
      const topMax = Math.max(0, top.scrollWidth - top.clientWidth);
      const tgtMax = Math.max(0, target.scrollWidth - target.clientWidth);
      if (topMax === 0 || tgtMax === 0) return;
      const ratio = target.scrollLeft / tgtMax;
      const desired = ratio * topMax;
      if (Math.abs(top.scrollLeft - desired) > 1) {
        top.scrollLeft = desired;
      }
    };

    // Initial sync and retries to catch late renders
    const timers = [
      setTimeout(() => { updateWidth(); syncFromTarget(); }, 0),
      setTimeout(() => { updateWidth(); syncFromTarget(); }, 120),
      setTimeout(() => { updateWidth(); syncFromTarget(); }, 300),
      setTimeout(() => { updateWidth(); syncFromTarget(); }, 600),
      setTimeout(() => { updateWidth(); syncFromTarget(); }, 1000)
    ];

    const onTopScroll = () => {
      syncFromTop();
    };

    const onTargetScroll = () => {
      syncFromTarget();
    };

    top.addEventListener('scroll', onTopScroll, { passive: true });

    if (target) {
      target.addEventListener('scroll', onTargetScroll, { passive: true });
      target.classList.add('hide-x-scrollbar');
    }

    // ResizeObserver for dynamic content changes
    const ro = new ResizeObserver(() => {
      updateWidth();
      syncFromTarget();
    });
    if (target) ro.observe(target);

    // MutationObserver to detect DOM changes
    const mo = new MutationObserver(() => {
      updateWidth();
      syncFromTarget();
    });
    if (target) {
      mo.observe(target, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
      top.removeEventListener('scroll', onTopScroll);
      const t = getTarget();
      if (t) {
        t.removeEventListener('scroll', onTargetScroll);
        t.classList.remove('hide-x-scrollbar');
      }
      ro.disconnect();
      mo.disconnect();
    };
  }, [viewType, searchTerm, selectedDepartment, currentDate, aggregatedEntities, loadingAggregated]);
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
  const handleDepartmentFilter = async (department: string) => {
    setSelectedDepartment(department);
    
    // Fetch aggregated data if not Terceirizados
    if (department !== "Terceirizados") {
      setLoadingAggregated(true);
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (viewType === 'daily') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (viewType === 'weekly') {
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      } else if (viewType === 'monthly') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      } else if (viewType === 'yearly') {
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
      }
      
      const entities = await fetchAggregatedData(department as any, startDate, endDate);
      setAggregatedEntities(entities);
      setLoadingAggregated(false);
    } else {
      setAggregatedEntities([]);
    }
  };
  const isQuadrantMode = selectedDepartment !== "Terceirizados";
  
  // Recarrega dados agregados quando data ou visualização mudarem
  useEffect(() => {
    const reloadAggregated = async () => {
      if (selectedDepartment === "Terceirizados") return;
      setLoadingAggregated(true);
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (viewType === 'daily') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (viewType === 'weekly') {
        startDate.setDate(currentDate.getDate() - currentDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      } else if (viewType === 'monthly') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      } else if (viewType === 'yearly') {
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
      }
      const entities = await fetchAggregatedData(selectedDepartment as any, startDate, endDate);
      setAggregatedEntities(entities);
      setLoadingAggregated(false);
    };
    reloadAggregated();
  }, [selectedDepartment, currentDate, viewType]);
  
  const filteredEmployees = escalasEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  
  const filteredEntities = aggregatedEntities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  if (loading || loadingAggregated) {
    return <div className="calendar-container lg:pl-4 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
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

          {/* Search and Color Toggle */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar funcionários..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            
            <Toggle
              pressed={isMonochrome}
              onPressedChange={setIsMonochrome}
              aria-label="Alternar modo de cores"
              className="shrink-0"
            >
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isMonochrome ? "Monocromático" : "Colorido"}</span>
              <span className="sm:hidden">{isMonochrome ? "Mono" : "Cor"}</span>
            </Toggle>
            
            <Toggle
              pressed={displayMode !== 'absolute'}
              onPressedChange={() => {
                setDisplayMode(prev => {
                  if (prev === 'absolute') return 'percentage';
                  if (prev === 'percentage') return 'hours';
                  return 'absolute';
                });
              }}
              aria-label="Alternar modo de exibição"
              className="shrink-0"
            >
              {displayMode === 'absolute' && <Hash className="h-4 w-4 mr-2" />}
              {displayMode === 'percentage' && <Percent className="h-4 w-4 mr-2" />}
              {displayMode === 'hours' && <Clock className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">
                {displayMode === 'absolute' && 'Números'}
                {displayMode === 'percentage' && 'Percentual'}
                {displayMode === 'hours' && 'Horas'}
              </span>
              <span className="sm:hidden">
                {displayMode === 'absolute' && '#'}
                {displayMode === 'percentage' && '%'}
                {displayMode === 'hours' && 'h'}
              </span>
            </Toggle>
          </div>
        </div>
      </header>

      {/* Top horizontal scrollbar */}
      <div 
        ref={topScrollRef}
        className="overflow-x-auto overflow-y-hidden bg-muted/30 border-b"
        style={{ height: '16px' }}
      >
        <div className="top-scroll-content" style={{ height: '1px', minWidth: '100%' }} />
      </div>

      {/* Main content area */}
      <main ref={mainScrollRef} className="calendar-main overflow-y-auto">
        <Card className="border-0 rounded-none">
          <CardContent className="p-0">
            {/* Calendar Views */}
            {viewType === 'daily' && <DailyView 
              currentDate={currentDate} 
              employees={filteredEmployees} 
              schedules={escalasSchedules} 
              selectedDepartments={[selectedDepartment]}
              isQuadrantMode={isQuadrantMode}
              aggregatedEntities={filteredEntities}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentFilter}
              departments={departments}
              isMonochrome={isMonochrome}
              displayMode={displayMode}
            />}
            
            {viewType === 'weekly' && <CalendarGrid 
              currentDate={currentDate} 
              employees={filteredEmployees} 
              schedules={escalasSchedules} 
              selectedDepartments={[selectedDepartment]}
              viewType={viewType}
              isQuadrantMode={isQuadrantMode}
              aggregatedEntities={filteredEntities}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentFilter}
              departments={departments}
              isMonochrome={isMonochrome}
              displayMode={displayMode}
            />}
            
            {viewType === 'monthly' && <MonthlyView 
              currentDate={currentDate} 
              employees={filteredEmployees} 
              schedules={escalasSchedules} 
              selectedDepartments={[selectedDepartment]}
              isQuadrantMode={isQuadrantMode}
              aggregatedEntities={filteredEntities}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentFilter}
              departments={departments}
              isMonochrome={isMonochrome}
              displayMode={displayMode}
            />}
            
            {viewType === 'yearly' && <YearlyView 
              currentDate={currentDate} 
              employees={filteredEmployees} 
              schedules={escalasSchedules} 
              selectedDepartments={[selectedDepartment]}
              isQuadrantMode={isQuadrantMode}
              aggregatedEntities={filteredEntities}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={handleDepartmentFilter}
              departments={departments}
              isMonochrome={isMonochrome}
              displayMode={displayMode}
            />}
          </CardContent>
        </Card>
      </main>

      {/* Footer with safe area for mobile */}
      <footer className="safe-bottom p-4 border-t bg-background">
        
      </footer>
    </div>;
}