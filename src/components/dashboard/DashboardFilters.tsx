import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DashboardFilters as Filters } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const DashboardFilters = ({ filters, onFiltersChange }: DashboardFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border shadow-sm">
      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Data Início</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.startDate ? format(filters.startDate, "PPP", { locale: ptBR }) : "Selecione"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate}
              onSelect={(date) => date && onFiltersChange({ ...filters, startDate: date })}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1">
        <label className="text-sm font-medium mb-2 block">Data Fim</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !filters.endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.endDate ? format(filters.endDate, "PPP", { locale: ptBR }) : "Selecione"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate}
              onSelect={(date) => date && onFiltersChange({ ...filters, endDate: date })}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
