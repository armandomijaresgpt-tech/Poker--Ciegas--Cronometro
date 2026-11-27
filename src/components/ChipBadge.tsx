import React from 'react';

interface ChipBadgeProps {
  value: number;
  color: string;
  size?: 'sm' | 'md';
  count?: number;
}

export const ChipBadge: React.FC<ChipBadgeProps> = ({
  value,
  color,
  size = 'sm',
  count,
}) => {
  const dim = size === 'md' ? 'w-11 h-11 text-[11px]' : 'w-9 h-9 text-[10px]';
  const formatted =
    value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(value);

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className={`${dim} rounded-full flex items-center justify-center font-mono-tabular font-bold text-white shadow-md border-2 border-dashed border-white/60 select-none`}
        style={{ backgroundColor: color }}
        title={`Ficha de ${value.toLocaleString('es-ES')}`}
      >
        <span className="bg-black/45 px-1 rounded-full leading-tight">{formatted}</span>
      </div>
      {count !== undefined && (
        <span className="text-[11px] font-mono-tabular font-semibold text-slate-300">
          ×{count}
        </span>
      )}
    </div>
  );
};
