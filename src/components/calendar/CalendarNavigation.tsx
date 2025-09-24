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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onNavigate("prev")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold min-w-48 text-center">
        {getDateFormat()}
      </h2>
      <Button variant="outline" size="sm" onClick={() => onNavigate("next")}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}