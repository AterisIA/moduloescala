import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { ViewMode } from "@/types/presence";

interface ViewModeFilterProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewModeFilter({ value, onChange }: ViewModeFilterProps) {
  return (
    <>
      {/* Mobile */}
      <div className="sm:hidden">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full touch-target">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terceirizados">Terceirizados</SelectItem>
            <SelectItem value="coordenadores">Coordenadores</SelectItem>
            <SelectItem value="plantao">Plantão</SelectItem>
            <SelectItem value="empresa">Empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="terceirizados">Terceirizados</SelectItem>
            <SelectItem value="coordenadores">Coordenadores</SelectItem>
            <SelectItem value="plantao">Plantão</SelectItem>
            <SelectItem value="empresa">Empresa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
