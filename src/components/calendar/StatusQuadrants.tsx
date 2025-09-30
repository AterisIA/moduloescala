import { PresenceStats } from '@/types/presence';

interface StatusQuadrantsProps {
  stats: PresenceStats;
}

export function StatusQuadrants({ stats }: StatusQuadrantsProps) {
  return (
    <div className="grid grid-cols-2 gap-[1px] bg-border h-full w-full">
      {/* Top Left - Presença (Green) */}
      <div className="bg-emerald-500 flex flex-col items-center justify-center p-1 min-h-[40px]">
        <div className="text-lg font-bold text-black">{stats.presenca}</div>
        <div className="text-[10px] font-semibold text-black/80">P</div>
      </div>

      {/* Top Right - Atestado (Yellow) */}
      <div className="bg-yellow-400 flex flex-col items-center justify-center p-1 min-h-[40px]">
        <div className="text-lg font-bold text-black">{stats.atestado}</div>
        <div className="text-[10px] font-semibold text-black/80">A</div>
      </div>

      {/* Bottom Left - Falta (Red) */}
      <div className="bg-red-500 flex flex-col items-center justify-center p-1 min-h-[40px]">
        <div className="text-lg font-bold text-black">{stats.falta}</div>
        <div className="text-[10px] font-semibold text-black/80">F</div>
      </div>

      {/* Bottom Right - Falta Justificada (Dark Red) */}
      <div className="bg-red-700 flex flex-col items-center justify-center p-1 min-h-[40px]">
        <div className="text-lg font-bold text-white">{stats.faltaJustificada}</div>
        <div className="text-[10px] font-semibold text-white/90">FJ</div>
      </div>
    </div>
  );
}
