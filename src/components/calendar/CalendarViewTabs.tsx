import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewType } from "@/types/calendar";

interface CalendarViewTabsProps {
  viewType: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function CalendarViewTabs({ viewType, onViewChange }: CalendarViewTabsProps) {
  return (
    <Tabs value={viewType} onValueChange={(value) => onViewChange(value as ViewType)}>
      <TabsList className="grid w-full grid-cols-4 h-10">
        <TabsTrigger value="daily" className="calendar-tab">Dia</TabsTrigger>
        <TabsTrigger value="weekly" className="calendar-tab">Semana</TabsTrigger>
        <TabsTrigger value="monthly" className="calendar-tab">Mês</TabsTrigger>
        <TabsTrigger value="yearly" className="calendar-tab">Ano</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}