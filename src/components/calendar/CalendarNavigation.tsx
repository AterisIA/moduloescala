import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarNavigationProps {
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function CalendarNavigation({ currentDate, onNavigate }: CalendarNavigationProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => onNavigate("prev")}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="text-lg font-semibold min-w-48 text-center">
        {format(currentDate, "MMMM yyyy", { locale: ptBR })}
      </h2>
      <Button variant="outline" size="sm" onClick={() => onNavigate("next")}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}