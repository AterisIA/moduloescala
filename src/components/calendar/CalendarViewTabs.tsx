import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewType } from "@/types/calendar";

interface CalendarViewTabsProps {
  viewType: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function CalendarViewTabs({ viewType, onViewChange }: CalendarViewTabsProps) {
  return (
    <Tabs value={viewType} onValueChange={(value) => onViewChange(value as ViewType)}>
      <TabsList>
        <TabsTrigger value="daily">Dia</TabsTrigger>
        <TabsTrigger value="weekly">Semana</TabsTrigger>
        <TabsTrigger value="monthly">Mês</TabsTrigger>
        <TabsTrigger value="yearly">Ano</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}