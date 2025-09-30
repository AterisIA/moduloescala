import { QuadrantData } from "@/types/calendar";

export type DisplayMode = 'absolute' | 'percentage' | 'hours';

interface QuadrantCellProps {
  data: QuadrantData;
  className?: string;
  isMonochrome?: boolean;
  displayMode?: DisplayMode;
  compact?: boolean;
}

export function QuadrantCell({ data, className = "", isMonochrome = false, displayMode = 'absolute', compact = false }: QuadrantCellProps) {
  const total = data.presenca + data.atraso + data.falta + data.faltaJustificada + data.atestado;
  
  const quadrants = [
    { 
      value: data.presenca, 
      label: "P", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-green-100 text-green-800" 
    },
    { 
      value: data.atraso, 
      label: "A", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-yellow-100 text-yellow-800" 
    },
    { 
      value: data.faltaJustificada, 
      label: "FJ", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800" 
    },
    { 
      value: data.falta + data.atestado, 
      label: "FI", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800" 
    }
  ];
  
  const getDisplayValue = (value: number, hours?: number) => {
    if (displayMode === 'percentage') {
      if (total === 0) return '0%';
      const percentage = Math.round((value / total) * 100);
      return `${percentage}%`;
    }
    
    if (displayMode === 'hours') {
      // Use real hours from database or fallback to count * 8
      const realHours = hours || (value * 8);
      return `${Math.round(realHours)}h`;
    }
    
    return value;
  };

  return (
    <div className={`grid grid-cols-2 gap-px w-full h-full ${compact ? 'min-h-[55px]' : 'min-h-[70px] sm:min-h-[80px]'} ${className}`}>
      {quadrants.map((quadrant, index) => {
        const hours = index === 0 ? data.presencaHoras :
                     index === 1 ? data.atrasoHoras :
                     index === 2 ? data.faltaJustificadaHoras :
                     (data.faltaHoras || 0) + (data.atestadoHoras || 0);
        
        return (
          <div
            key={index}
            className={`flex flex-col items-center justify-center ${
              compact ? 'px-1 py-1' : 'px-1 py-2'
            } ${quadrant.color} rounded-sm overflow-hidden`}
          >
            <div className={`font-bold leading-none whitespace-nowrap ${
              compact 
                ? 'text-xs' 
                : 'text-sm sm:text-base md:text-lg'
            }`}>
              {getDisplayValue(quadrant.value, hours)}
            </div>
            <div className={`font-medium whitespace-nowrap ${
              compact 
                ? 'text-[8px] mt-0.5' 
                : 'text-[9px] sm:text-[10px] md:text-xs mt-1'
            }`}>
              {quadrant.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
