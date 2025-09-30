import { QuadrantData } from "@/types/calendar";

export type DisplayMode = 'absolute' | 'percentage' | 'hours';

interface QuadrantCellProps {
  data: QuadrantData;
  className?: string;
  isMonochrome?: boolean;
  displayMode?: DisplayMode;
}

export function QuadrantCell({ data, className = "", isMonochrome = false, displayMode = 'absolute' }: QuadrantCellProps) {
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
    <div className={`grid grid-cols-2 gap-px w-full h-full min-h-[50px] sm:min-h-[60px] ${className}`}>
      {quadrants.map((quadrant, index) => {
        const hours = index === 0 ? data.presencaHoras :
                     index === 1 ? data.atrasoHoras :
                     index === 2 ? data.faltaJustificadaHoras :
                     (data.faltaHoras || 0) + (data.atestadoHoras || 0);
        
        return (
          <div
            key={index}
            className={`flex flex-col items-center justify-center px-0.5 py-1 ${quadrant.color} rounded-sm`}
          >
            <div className="text-xs sm:text-sm md:text-base font-bold leading-none truncate max-w-full">
              {getDisplayValue(quadrant.value, hours)}
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium mt-0.5 truncate max-w-full">
              {quadrant.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
