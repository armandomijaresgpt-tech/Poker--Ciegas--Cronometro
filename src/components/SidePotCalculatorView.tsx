import React, { useMemo, useState } from 'react';
import { Calculator, Plus, Trash2, RotateCcw, Award } from 'lucide-react';
import {
  calculateSidePots,
  HAND_RANKINGS,
  SidePotInputPlayer,
  THEME_PALETTES,
} from '../data/presets';
import { ThemeColorId } from '../types/poker';
import { formatFichas } from '../hooks/usePokerClock';
import { NumericInput } from './NumericInput';

interface SidePotCalculatorViewProps {
  themeColor: ThemeColorId;
}

const DEFAULT_POT_PLAYERS: SidePotInputPlayer[] = [
  { id: 'sp-1', name: 'Jugador 1', bet: 500, folded: false },
  { id: 'sp-2', name: 'Jugador 2', bet: 250, folded: false },
  { id: 'sp-3', name: 'Jugador 3', bet: 800, folded: false },
  { id: 'sp-4', name: 'Jugador 4', bet: 300, folded: false },
];

export const SidePotCalculatorView: React.FC<SidePotCalculatorViewProps> = ({
  themeColor,
}) => {
  const [players, setPlayers] = useState<SidePotInputPlayer[]>(DEFAULT_POT_PLAYERS);
  const [showExplanation, setShowExplanation] = useState(true);
  const palette = THEME_PALETTES[themeColor];

  const pots = useMemo(() => calculateSidePots(players), [players]);
  const totalInPot = useMemo(
    () => players.reduce((s, p) => s + Math.max(0, p.bet), 0),
    [players]
  );

  const addPlayer = () => {
    setPlayers((prev) => [
      ...prev,
      {
        id: `sp-${Date.now()}`,
        name: `Jugador ${prev.length + 1}`,
        bet: 0,
        folded: false,
      },
    ]);
  };

  const updatePlayer = (id: string, patch: Partial<SidePotInputPlayer>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => (prev.length <= 2 ? prev : prev.filter((p) => p.id !== id)));
  };

  const resetAll = () => {
    setPlayers([
      { id: 'sp-r1', name: 'Jugador 1', bet: 0, folded: false },
      { id: 'sp-r2', name: 'Jugador 2', bet: 0, folded: false },
      { id: 'sp-r3', name: 'Jugador 3', bet: 0, folded: false },
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Side Pot Calculator */}
      <section className="lg:col-span-7 rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5" style={{ color: palette.primaryHex }} />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                Calculadora de botes paralelos
              </h1>
              <p className="text-xs text-slate-400">
                Introduce las fichas apostadas por cada jugador en un All-In múltiple
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="min-h-[40px] flex items-center gap-1.5 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.06] px-3.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-400 px-1">
            <div className="col-span-5">Jugador</div>
            <div className="col-span-4">Apuesta (fichas)</div>
            <div className="col-span-3 text-right">Estado</div>
          </div>

          {players.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
                aria-label="Nombre de jugador"
                className="col-span-5 min-h-[44px] rounded-xl bg-[#0A0C10] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-white/30"
              />
              <NumericInput
                min={0}
                value={p.bet}
                onChange={(val) => updatePlayer(p.id, { bet: val })}
                aria-label={`Apuesta de ${p.name}`}
                className="col-span-4 min-h-[44px] rounded-xl bg-[#0A0C10] border border-white/10 px-3 text-sm font-mono-tabular text-white focus:outline-none focus:border-white/30"
              />
              <div className="col-span-3 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => updatePlayer(p.id, { folded: !p.folded })}
                  className={`min-h-[40px] px-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    p.folded
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                  title="Marcar si el jugador se retiró tras apostar"
                >
                  {p.folded ? 'Fold' : 'Activo'}
                </button>
                <button
                  type="button"
                  onClick={() => removePlayer(p.id)}
                  disabled={players.length <= 2}
                  className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                  aria-label={`Quitar a ${p.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={addPlayer}
            className="min-h-[44px] flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer"
            style={{ backgroundColor: palette.primaryHex }}
          >
            <Plus className="w-4 h-4" />
            <span>Añadir jugador</span>
          </button>

          <label className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showExplanation}
              onChange={(e) => setShowExplanation(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: palette.primaryHex }}
            />
            <span>Explicar cálculo paso a paso</span>
          </label>
        </div>

        {/* Calculated Pots Output */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Resultado de los botes</h2>
            <span className="text-xs font-mono-tabular text-slate-400">
              Total en mesa: <strong className="text-white">{formatFichas(totalInPot)}</strong>
            </span>
          </div>

          {pots.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              Introduce apuestas mayores a 0 para calcular los botes.
            </p>
          ) : (
            <div className="space-y-2.5">
              {pots.map((pot) => (
                <div
                  key={pot.name}
                  className="rounded-xl bg-[#181C26] border border-white/[0.08] p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{pot.name}</span>
                    <span className="text-xl font-bold font-mono-tabular text-emerald-400">
                      {formatFichas(pot.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Optan al bote:{' '}
                    <strong className="text-white">{pot.eligiblePlayers.join(', ')}</strong>
                  </div>
                  {showExplanation && (
                    <div className="text-xs text-slate-400 leading-relaxed pt-1">
                      {pot.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Hand Rankings Cheat Sheet */}
      <section className="lg:col-span-5 rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5" style={{ color: palette.primaryHex }} />
          <div>
            <h2 className="text-lg font-bold text-white">Orden de manos de póker</h2>
            <p className="text-xs text-slate-400">De mayor a menor valor en Texas Hold&apos;em</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {HAND_RANKINGS.map((hand) => (
            <div key={hand.rank} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">
                  <span className="font-mono-tabular text-slate-500 mr-2">
                    {String(hand.rank).padStart(2, '0')}.
                  </span>
                  {hand.name}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{hand.desc}</div>
              </div>
              <div className="text-xs font-mono-tabular text-slate-200 whitespace-nowrap shrink-0">
                {hand.example}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
