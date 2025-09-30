import React from 'react';
import { PresenceStats } from '@/types/presence';

interface StatusQuadrantsProps {
  stats: PresenceStats;
  size?: 'small' | 'medium' | 'large';
}

export function StatusQuadrants({ stats, size = 'medium' }: StatusQuadrantsProps) {
  const sizeClasses = {
    small: 'w-12 h-12 text-[10px]',
    medium: 'w-16 h-16 text-xs',
    large: 'w-20 h-20 text-sm'
  };

  const containerClass = sizeClasses[size];

  return (
    <div className={`grid grid-cols-2 gap-0.5 ${containerClass} border-2 border-border`}>
      {/* Quadrante 1: Presença (Verde) */}
      <div className="flex flex-col items-center justify-center bg-[hsl(142,76%,36%)] text-white font-bold">
        <div>{stats.presenca}</div>
        <div className="text-[8px] opacity-80">P</div>
      </div>
      
      {/* Quadrante 2: Atestado (Amarelo) */}
      <div className="flex flex-col items-center justify-center bg-[hsl(48,96%,53%)] text-gray-900 font-bold">
        <div>{stats.atestado}</div>
        <div className="text-[8px] opacity-80">A</div>
      </div>
      
      {/* Quadrante 3: Falta (Vermelho) */}
      <div className="flex flex-col items-center justify-center bg-[hsl(0,72%,51%)] text-white font-bold">
        <div>{stats.falta}</div>
        <div className="text-[8px] opacity-80">F</div>
      </div>
      
      {/* Quadrante 4: Falta Justificada (Vermelho Escuro) */}
      <div className="flex flex-col items-center justify-center bg-[hsl(0,50%,35%)] text-white font-bold">
        <div>{stats.faltaJustificada}</div>
        <div className="text-[8px] opacity-80">FJ</div>
      </div>
    </div>
  );
}
