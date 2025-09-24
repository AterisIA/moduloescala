import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SelectedChipsBarProps {
  selectedDepartments: string[];
  onRemoveDepartment: (department: string) => void;
  onClearAll: () => void;
}

export function SelectedChipsBar({ 
  selectedDepartments, 
  onRemoveDepartment, 
  onClearAll 
}: SelectedChipsBarProps) {
  if (selectedDepartments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Filtros ativos:</span>
      {selectedDepartments.map((dept) => (
        <Badge key={dept} variant="secondary" className="flex items-center gap-1">
          {dept}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 w-4 h-4"
            onClick={() => onRemoveDepartment(dept)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      <Button variant="outline" size="sm" onClick={onClearAll}>
        Limpar todos
      </Button>
    </div>
  );
}