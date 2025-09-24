import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ViewType } from "@/types/calendar";

interface CalendarNavigationProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  viewType: ViewType;
}

export function CalendarNavigation({ currentDate, onNavigate, viewType }: CalendarNavigationProps) {
  const getDateFormat = () => {
    switch (viewType) {
      case 'daily':
        return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'weekly':
        return format(currentDate, "'Semana de' dd 'de' MMMM yyyy", { locale: ptBR });
      case 'monthly':
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
      case 'yearly':
        return format(currentDate, "yyyy", { locale: ptBR });
      default:
        return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onNavigate("prev")}
        className="touch-target flex-shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Anterior</span>
      </Button>
      
      <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-center flex-1 px-2">
        {getDateFormat()}
      </h2>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onNavigate("next")}
        className="touch-target flex-shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Próximo</span>
      </Button>
    </div>
  );
}