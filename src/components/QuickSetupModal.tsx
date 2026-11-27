import React, { useEffect, useMemo, useState } from 'react';
import { X, Wand2 } from 'lucide-react';
import { AnteMode, ChipDefinition } from '../types/poker';
import {
  calculateChipDistribution,
  QuickSetupInput,
  THEME_PALETTES,
} from '../data/presets';
import { ThemeColorId } from '../types/poker';
import { ChipBadge } from './ChipBadge';
import { Tooltip } from './Tooltip';

interface QuickSetupModalProps {
  isOpen: boolean;
  chips: ChipDefinition[];
  currentTitle: string;
  themeColor: ThemeColorId;
  onClose: () => void;
  onApply: (input: QuickSetupInput, customTitle?: string) => void;
}

export const QuickSetupModal: React.FC<QuickSetupModalProps> = ({
  isOpen,
  chips,
  currentTitle,
  themeColor,
  onClose,
  onApply,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [gameType, setGameType] = useState<QuickSetupInput['gameType']>('normal');
  const [playerCountRange, setPlayerCountRange] = useState('8-11');
  const [targetMinutes, setTargetMinutes] = useState(240);
  const [levelMinutes, setLevelMinutes] = useState(20);
  const [smallestChip, setSmallestChip] = useState(25);
  const [startingStack, setStartingStack] = useState(5000);
  const [anteMode, setAnteMode] = useState<AnteMode>('none');

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const palette = THEME_PALETTES[themeColor];

  const chipBreakdown = useMemo(
    () => calculateChipDistribution(startingStack, smallestChip, chips),
    [startingStack, smallestChip, chips]
  );

  if (!isOpen) return null;

  const startingBB = Math.round(startingStack / (smallestChip * 2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(
      {
        gameType,
        playerCountRange,
        targetMinutes,
        levelMinutes,
        smallestChip,
        startingStack,
        anteMode,
      },
      title
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-setup-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[calc(100dvh-24px)] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-[#12151C] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <Wand2 className="w-5 h-5" style={{ color: palette.primaryHex }} />
            <h2 id="quick-setup-title" className="text-lg font-bold text-white">
              Asistente rápido (Quick Setup)
            </h2>
          </div>
          <Tooltip title="Cerrar asistente" content="Cierra el asistente sin modificar tu estructura actual.">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
              aria-label="Cerrar asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Nombre del torneo o partida
          </label>
          <Tooltip title="Nombre de la partida" content="Título que aparecerá arriba en el reloj y en el historial al guardar la partida." className="w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Póker del Viernes"
              className="min-h-[44px] w-full rounded-xl bg-[#0A0C10] border border-white/15 px-3.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </Tooltip>
        </div>

        {/* Game Type */}
        <OptionGroup label="Tipo de juego">
          {(
            [
              { id: 'normal', label: 'Normal' },
              { id: 'turbo', label: 'Turbo' },
              { id: 'deep', label: 'Deep Stack' },
              { id: 'cash', label: 'Cash' },
              { id: 'micro', label: 'Micro Stakes' },
            ] as const
          ).map((item) => (
            <SelectChipButton
              key={item.id}
              active={gameType === item.id}
              accentColor={palette.primaryHex}
              onClick={() => {
                setGameType(item.id);
                if (item.id === 'turbo') setLevelMinutes(10);
                if (item.id === 'deep') setLevelMinutes(30);
                if (item.id === 'normal') setLevelMinutes(20);
                if (item.id === 'micro') {
                  setSmallestChip(1);
                  setStartingStack(500);
                }
              }}
            >
              {item.label}
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Players */}
        <OptionGroup label="Jugadores estimados">
          {['2-4', '5-7', '8-11', '12-15', '16-18'].map((range) => (
            <SelectChipButton
              key={range}
              active={playerCountRange === range}
              accentColor={palette.primaryHex}
              onClick={() => setPlayerCountRange(range)}
            >
              {range}
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Total Game Length */}
        {gameType !== 'cash' && (
          <OptionGroup label="Duración aproximada del torneo">
            {[
              { min: 90, label: '90 min' },
              { min: 180, label: '3 horas' },
              { min: 240, label: '4 horas' },
              { min: 300, label: '5 horas' },
            ].map((item) => (
              <SelectChipButton
                key={item.min}
                active={targetMinutes === item.min}
                accentColor={palette.primaryHex}
                onClick={() => setTargetMinutes(item.min)}
              >
                {item.label}
              </SelectChipButton>
            ))}
          </OptionGroup>
        )}

        {/* Level Length */}
        <OptionGroup label="Duración de cada nivel">
          {[10, 15, 20, 30].map((min) => (
            <SelectChipButton
              key={min}
              active={levelMinutes === min}
              accentColor={palette.primaryHex}
              onClick={() => setLevelMinutes(min)}
            >
              {min} min
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Smallest Chip */}
        <OptionGroup label="Ficha más pequeña">
          {[1, 5, 10, 25, 50, 100].map((val) => (
            <SelectChipButton
              key={val}
              active={smallestChip === val}
              accentColor={palette.primaryHex}
              onClick={() => setSmallestChip(val)}
            >
              {val}
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Starting Stack */}
        <OptionGroup label="Stack inicial">
          {[1500, 3000, 5000, 10000, 20000].map((val) => (
            <SelectChipButton
              key={val}
              active={startingStack === val}
              accentColor={palette.primaryHex}
              onClick={() => setStartingStack(val)}
            >
              {val.toLocaleString('es-ES')}
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Ante Mode */}
        <OptionGroup label="Tipo de Ante">
          {(
            [
              { id: 'none', label: 'Sin Ante' },
              { id: 'per_player', label: 'Por jugador' },
              { id: 'big_blind', label: 'Big Blind Ante' },
            ] as const
          ).map((mode) => (
            <SelectChipButton
              key={mode.id}
              active={anteMode === mode.id}
              accentColor={palette.primaryHex}
              onClick={() => setAnteMode(mode.id)}
            >
              {mode.label}
            </SelectChipButton>
          ))}
        </OptionGroup>

        {/* Live Starting Chips Breakdown */}
        <Tooltip
          title="Reparto automático de fichas"
          content="Sugerencia equilibrada de cuántas fichas de cada color dar a cada jugador al empezar."
          className="w-full block"
        >
          <div className="w-full rounded-xl bg-[#0A0C10] border border-white/[0.08] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-white">Reparto recomendado por jugador</span>
              <span className="font-mono-tabular text-slate-400">
                BB inicial: {smallestChip * 2} · {startingBB} Big Blinds
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {chipBreakdown.map((item) => (
                <ChipBadge
                  key={item.value}
                  value={item.value}
                  color={item.color}
                  count={item.count}
                />
              ))}
            </div>
          </div>
        </Tooltip>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Tooltip title="Cancelar" content="Cierra el asistente sin cambiar tu estructura actual.">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 rounded-xl text-sm font-medium text-slate-300 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </Tooltip>
          <Tooltip
            title="Generar y aplicar"
            content="Crea una nueva estructura con estos parámetros, la guarda en tus estructuras y la activa en el reloj."
          >
            <button
              type="submit"
              className="min-h-[46px] px-6 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer"
              style={{ backgroundColor: palette.primaryHex }}
            >
              Generar estructura y aplicar
            </button>
          </Tooltip>
        </div>
      </form>
    </div>
  );
};

const OptionGroup: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="space-y-2">
    <div className="text-xs font-medium text-slate-400">{label}</div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const SelectChipButton: React.FC<{
  active: boolean;
  accentColor: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, accentColor, onClick, children }) => (
  <Tooltip
    title={`Opción: ${typeof children === 'string' ? children : 'Seleccionar'}`}
    content="Toca para elegir este parámetro en el generador automático de estructura."
  >
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
        active
          ? 'text-white font-semibold'
          : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
      }`}
      style={active ? { backgroundColor: accentColor } : undefined}
    >
      {children}
    </button>
  </Tooltip>
);
