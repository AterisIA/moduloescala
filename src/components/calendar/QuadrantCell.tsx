import { QuadrantData } from "@/types/calendar";

interface QuadrantCellProps {
  data: QuadrantData;
  className?: string;
  isMonochrome?: boolean;
}

export function QuadrantCell({ data, className = "", isMonochrome = false }: QuadrantCellProps) {
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
      value: data.falta, 
      label: "F", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-red-100 text-red-800" 
    },
    { 
      value: data.faltaJustificada + data.atestado, 
      label: "FJ/AT", 
      color: isMonochrome ? "bg-gray-100 text-gray-800" : "bg-blue-100 text-blue-800" 
    }
  ];

  return (
    <div className={`grid grid-cols-2 gap-0.5 w-full h-full min-h-[60px] ${className}`}>
      {quadrants.map((quadrant, index) => (
        <div
          key={index}
          className={`flex flex-col items-center justify-center p-1 ${quadrant.color} rounded-sm`}
        >
          <div className="text-lg font-bold leading-none">
            {quadrant.value}
          </div>
          <div className="text-[10px] font-medium mt-0.5">
            {quadrant.label}
          </div>
        </div>
      ))}
    </div>
  );
}
