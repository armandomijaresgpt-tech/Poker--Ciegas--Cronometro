import React, { useMemo, useState } from 'react';
import {
  Plus,
  Minus,
  Coffee,
  Trash2,
  ArrowUp,
  ArrowDown,
  Play,
  CopyPlus,
  Clock,
  Star,
  Wand2,
  Trophy,
  Coins,
  Layers,
} from 'lucide-react';
import {
  AnteMode,
  BlindLevel,
  ChipDefinition,
  StructurePreset,
  ThemeColorId,
  TournamentMoneyConfig,
} from '../types/poker';
import {
  calculateChipDistribution,
  QuickSetupInput,
  THEME_PALETTES,
} from '../data/presets';
import { ChipBadge } from './ChipBadge';
import { QuickSetupModal } from './QuickSetupModal';
import { NumericInput } from './NumericInput';
import { Tooltip } from './Tooltip';

interface StructureViewProps {
  tournamentTitle: string;
  presets: StructurePreset[];
  activePreset: StructurePreset;
  currentLevelIndex: number;
  anteMode: AnteMode;
  moneyConfig: TournamentMoneyConfig;
  chips: ChipDefinition[];
  startingStack: number;
  themeColor: ThemeColorId;
  onSelectPreset: (presetId: string) => void;
  onToggleFavorite: (presetId: string) => void;
  onApplyQuickSetup: (input: QuickSetupInput, customTitle?: string) => void;
  onChangeAnteMode: (mode: AnteMode) => void;
  onUpdateLevel: (levelId: string, patch: Partial<BlindLevel>) => void;
  onAddLevel: (type: 'level' | 'break') => void;
  onRemoveLevel: (levelId: string) => void;
  onMoveLevel: (index: number, direction: -1 | 1) => void;
  onApplyGlobalDuration: (minutes: number) => void;
  onCreateCustomPreset: (name: string) => void;
  onDeleteCustomPreset: (presetId: string) => void;
  onUpdateMoneyConfig: (patch: Partial<TournamentMoneyConfig>) => void;
  onUpdateChip: (chipId: string, patch: Partial<ChipDefinition>) => void;
  onAddChip: () => void;
  onRemoveChip: (chipId: string) => void;
  onUpdateStartingStack: (stack: number) => void;
  onStartPlaying: () => void;
}

type StructureSubTab = 'levels' | 'money' | 'chips';

export const StructureView: React.FC<StructureViewProps> = ({
  tournamentTitle,
  presets,
  activePreset,
  currentLevelIndex,
  anteMode,
  moneyConfig,
  chips,
  startingStack,
  themeColor,
  onSelectPreset,
  onToggleFavorite,
  onApplyQuickSetup,
  onChangeAnteMode,
  onUpdateLevel,
  onAddLevel,
  onRemoveLevel,
  onMoveLevel,
  onApplyGlobalDuration,
  onCreateCustomPreset,
  onDeleteCustomPreset,
  onUpdateMoneyConfig,
  onUpdateChip,
  onAddChip,
  onRemoveChip,
  onUpdateStartingStack,
  onStartPlaying,
}) => {
  const [subTab, setSubTab] = useState<StructureSubTab>('levels');
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showNewPresetInput, setShowNewPresetInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [customMinutes, setCustomMinutes] = useState('15');

  const palette = THEME_PALETTES[themeColor];
  const levels = activePreset.levels;
  const totalMinutes = levels.reduce((acc, l) => acc + l.durationMinutes, 0);
  const playLevelsCount = levels.filter((l) => l.type === 'level').length;

  const visiblePresets = useMemo(() => {
    if (!onlyFavorites) return presets;
    const favs = presets.filter((p) => p.isFavorite);
    return favs.length > 0 ? favs : presets;
  }, [presets, onlyFavorites]);

  const lowestChip = useMemo(
    () => chips.reduce((min, c) => Math.min(min, c.value), chips[0]?.value || 25),
    [chips]
  );

  const startingBreakdown = useMemo(
    () => calculateChipDistribution(startingStack, lowestChip, chips),
    [startingStack, lowestChip, chips]
  );

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onCreateCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setShowNewPresetInput(false);
  };

  const stepBlind = (val: number, dir: 1 | -1) => {
    const step = val >= 1000 ? 100 : val >= 200 ? 50 : val >= 50 ? 25 : 5;
    return Math.max(1, val + step * dir);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Configuración del torneo
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {playLevelsCount} niveles · {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total · Guardado automático
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Tooltip
              title="Asistente Quick Setup"
              content="Responde 4 datos rápidos (estilo, duración, ficha menor y stack) y crea automáticamente toda la estructura de ciegas y descansos."
            >
              <button
                type="button"
                onClick={() => setShowQuickSetup(true)}
                className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-4 py-2 text-sm font-medium text-white transition-all whitespace-nowrap cursor-pointer"
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Quick Setup</span>
              </button>
            </Tooltip>

            <Tooltip
              title="Ir al reloj"
              content="Vuelve inmediatamente al cronómetro en vivo con esta estructura aplicada."
            >
              <button
                type="button"
                onClick={onStartPlaying}
                className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] px-5 py-2 text-sm font-semibold text-white transition-all whitespace-nowrap cursor-pointer"
                style={{ backgroundColor: palette.primaryHex }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Ir al reloj</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div data-tour="structure-subtabs" className="mt-5 flex flex-wrap gap-2">
          {(
            [
              {
                id: 'levels',
                label: 'Niveles y Ciegas',
                icon: Layers,
                tip: 'Elige una plantilla o edita una a una las ciegas, antes, descansos y duración.',
              },
              {
                id: 'money',
                label: 'Entradas, Rebuys y Premios',
                icon: Trophy,
                tip: 'Define el coste en fichas de entrada, rebuy, add-on y el % de premios por puesto.',
              },
              {
                id: 'chips',
                label: 'Fichas y Stack',
                icon: Coins,
                tip: 'Personaliza los colores y valores de tu maletín y calcula el reparto inicial.',
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <Tooltip key={tab.id} title={tab.label} content={tab.tip}>
                <button
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`min-h-[40px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-950 font-semibold'
                      : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {/* SUB-TAB 1: LEVELS & PRESETS */}
      {subTab === 'levels' && (
        <>
          <section
            data-tour="structure-presets"
            className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">Estructuras guardadas</span>
              <Tooltip
                title="Filtrar favoritos"
                content="Muestra únicamente las estructuras que hayas marcado con una estrella."
              >
                <button
                  type="button"
                  onClick={() => setOnlyFavorites((v) => !v)}
                  className={`min-h-[36px] flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    onlyFavorites
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-[#181C26] text-slate-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-300' : ''}`} />
                  <span>Solo favoritos</span>
                </button>
              </Tooltip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {visiblePresets.map((preset) => {
                const isActive = preset.id === activePreset.id;
                return (
                  <div key={preset.id} className="flex items-center">
                    <Tooltip
                      title={`Cargar "${preset.name}"`}
                      content={preset.description}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectPreset(preset.id)}
                        className={`min-h-[42px] px-3.5 py-2 text-sm font-medium rounded-l-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
                        }`}
                        style={isActive ? { backgroundColor: palette.primaryHex } : undefined}
                      >
                        {preset.name}
                      </button>
                    </Tooltip>
                    <Tooltip
                      title="Favorito"
                      content="Marca o desmarca esta estructura como favorita para encontrarla más rápido."
                    >
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(preset.id)}
                        className={`min-h-[42px] px-2.5 rounded-r-xl border-l border-black/20 transition-colors cursor-pointer ${
                          isActive
                            ? 'text-white'
                            : 'bg-[#181C26] text-slate-400 hover:text-amber-300 border-y border-r border-white/[0.06]'
                        }`}
                        style={isActive ? { backgroundColor: palette.primaryHex } : undefined}
                        aria-label={`Marcar ${preset.name} como favorita`}
                        title="Favorito"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            preset.isFavorite ? 'fill-amber-300 text-amber-300' : ''
                          }`}
                        />
                      </button>
                    </Tooltip>
                    {!preset.isBuiltIn && isActive && (
                      <Tooltip
                        title="Eliminar estructura"
                        content="Borra esta estructura personalizada."
                      >
                        <button
                          type="button"
                          onClick={() => onDeleteCustomPreset(preset.id)}
                          className="ml-1 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] cursor-pointer"
                          aria-label={`Eliminar estructura ${preset.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                  </div>
                );
              })}

              {!showNewPresetInput ? (
                <Tooltip
                  title="Guardar copia"
                  content="Duplica la estructura actual con un nombre propio para crear tu torneo personalizado."
                >
                  <button
                    type="button"
                    onClick={() => setShowNewPresetInput(true)}
                    className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border border-dashed border-white/20 text-slate-300 hover:text-white hover:border-white/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CopyPlus className="w-4 h-4" />
                    <span>Guardar como nueva</span>
                  </button>
                </Tooltip>
              ) : (
                <form onSubmit={handleCreatePreset} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Nombre del torneo..."
                    autoFocus
                    className="min-h-[42px] w-44 rounded-xl bg-[#0A0C10] border border-white/20 px-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] px-3.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: palette.primaryHex }}
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewPresetInput(false)}
                    className="min-h-[42px] px-3 rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              )}
            </div>

            {/* Ante Mode & Global Duration Row */}
            <div className="pt-4 border-t border-white/[0.08] grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-slate-300 mr-1">Modo de Ante:</span>
                {(
                  [
                    {
                      id: 'none',
                      label: 'Sin Ante',
                      tip: 'Oculta el Ante en el reloj y en los niveles.',
                    },
                    {
                      id: 'per_player',
                      label: 'Por jugador',
                      tip: 'Ante clásico: todos los jugadores en la mano pagan el Ante.',
                    },
                    {
                      id: 'big_blind',
                      label: 'Big Blind Ante',
                      tip: 'Formato moderno: solo la Ciega Grande paga el Ante único de la mesa.',
                    },
                  ] as const
                ).map((mode) => (
                  <Tooltip key={mode.id} title={mode.label} content={mode.tip}>
                    <button
                      type="button"
                      onClick={() => onChangeAnteMode(mode.id)}
                      className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        anteMode === mode.id
                          ? 'bg-white text-slate-950 font-semibold'
                          : 'bg-[#181C26] text-slate-300 border border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  </Tooltip>
                ))}
              </div>

              <div className="flex flex-wrap items-center lg:justify-end gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs sm:text-sm text-slate-300">Minutos/nivel:</span>
                {[10, 15, 20, 30].map((min) => (
                  <Tooltip
                    key={min}
                    title={`Aplicar ${min} minutos`}
                    content={`Cambia la duración de todos los niveles de juego a ${min} minutos de un solo toque.`}
                  >
                    <button
                      type="button"
                      onClick={() => onApplyGlobalDuration(min)}
                      className="min-h-[36px] px-2.5 rounded-lg bg-[#181C26] hover:bg-white/[0.1] border border-white/[0.06] text-xs font-mono-tabular font-medium text-slate-200 cursor-pointer"
                    >
                      {min}m
                    </button>
                  </Tooltip>
                ))}
                <Tooltip
                  title="Duración personalizada"
                  content="Escribe los minutos que quieres asignar a todos los niveles de esta estructura."
                >
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={180}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    aria-label="Minutos personalizados"
                    className="min-h-[36px] w-14 rounded-lg bg-[#0A0C10] border border-white/15 px-2 text-center text-xs font-mono-tabular text-white"
                  />
                </Tooltip>
                <Tooltip
                  title="Aplicar a todos los niveles"
                  content="Aplica el número de minutos escrito a todos los niveles activos."
                >
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(customMinutes, 10);
                      if (!Number.isNaN(val) && val > 0) onApplyGlobalDuration(val);
                    }}
                    className="min-h-[36px] px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white cursor-pointer"
                  >
                    Aplicar
                  </button>
                </Tooltip>
              </div>
            </div>
          </section>

          {/* Editable Levels Table */}
          <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 border-b border-white/[0.08] text-xs font-medium text-slate-400">
              <div className="col-span-2">Nivel</div>
              <div className="col-span-3">Ciega pequeña</div>
              <div className="col-span-3">Ciega grande</div>
              <div className="col-span-1">Ante</div>
              <div className="col-span-1">Min</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {levels.map((lvl, idx) => {
                const isCurrent = idx === currentLevelIndex;
                let playIdx = 0;
                for (let j = 0; j <= idx; j++) {
                  if (levels[j].type === 'level') playIdx++;
                }

                return (
                  <div
                    key={lvl.id}
                    className={`px-4 py-3.5 sm:px-5 transition-colors ${
                      isCurrent ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {lvl.type === 'break' ? (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-9 flex items-center gap-3">
                          <span className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                            <Coffee className="w-4 h-4 shrink-0" />
                            <span>Descanso</span>
                          </span>
                          <Tooltip
                            title="Nombre del descanso"
                            content="Personaliza la etiqueta que aparecerá en el reloj durante esta pausa."
                            className="flex-1 max-w-xs"
                          >
                            <input
                              type="text"
                              value={lvl.label || 'Descanso'}
                              onChange={(e) => onUpdateLevel(lvl.id, { label: e.target.value })}
                              aria-label="Nombre del descanso"
                              className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-3 text-sm text-white"
                            />
                          </Tooltip>
                        </div>

                        <div className="md:col-span-1 flex items-center gap-2">
                          <span className="md:hidden text-xs text-slate-400 w-24">Minutos:</span>
                          <Tooltip
                            title="Duración del descanso"
                            content="Minutos que durará esta pausa antes de reanudar el siguiente nivel."
                            className="w-full"
                          >
                            <NumericInput
                              min={1}
                              max={180}
                              value={lvl.durationMinutes}
                              onChange={(val) =>
                                onUpdateLevel(lvl.id, { durationMinutes: val })
                              }
                              aria-label="Duración descanso"
                              className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-2 text-center text-sm font-mono-tabular text-amber-200"
                            />
                          </Tooltip>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-end gap-1">
                          <Tooltip title="Subir descanso" content="Mueve este descanso una posición arriba.">
                            <button
                              type="button"
                              onClick={() => onMoveLevel(idx, -1)}
                              disabled={idx === 0}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Bajar descanso" content="Mueve este descanso una posición abajo.">
                            <button
                              type="button"
                              onClick={() => onMoveLevel(idx, 1)}
                              disabled={idx === levels.length - 1}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Eliminar descanso" content="Quita este descanso de la estructura.">
                            <button
                              type="button"
                              onClick={() => onRemoveLevel(lvl.id)}
                              disabled={levels.length <= 1}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-center">
                        <div className="col-span-2 md:col-span-2 flex items-center justify-between md:justify-start gap-2">
                          <span className="font-mono-tabular font-semibold text-sm text-white">
                            Nivel {playIdx}
                            {isCurrent && (
                              <span className="ml-2 text-xs font-medium text-amber-300">
                                · Activo
                              </span>
                            )}
                          </span>

                          <div className="flex md:hidden items-center gap-1">
                            <Tooltip title="Subir nivel" content="Sube este nivel una posición en el orden.">
                              <button
                                type="button"
                                onClick={() => onMoveLevel(idx, -1)}
                                disabled={idx === 0}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Bajar nivel" content="Baja este nivel una posición en el orden.">
                              <button
                                type="button"
                                onClick={() => onMoveLevel(idx, 1)}
                                disabled={idx === levels.length - 1}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Eliminar nivel" content="Quita este nivel de la lista.">
                              <button
                                type="button"
                                onClick={() => onRemoveLevel(lvl.id)}
                                disabled={levels.length <= 1}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Small Blind with -/+ Steppers */}
                        <div className="md:col-span-3">
                          <label className="block md:hidden text-[11px] text-slate-400 mb-1">
                            Ciega pequeña
                          </label>
                          <div className="flex items-center gap-1">
                            <Tooltip title="Bajar Ciega Pequeña" content="Reduce un paso el valor estándar de la ciega pequeña.">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLevel(lvl.id, {
                                    smallBlind: stepBlind(lvl.smallBlind, -1),
                                  })
                                }
                                className="min-h-[40px] min-w-[34px] flex items-center justify-center rounded-lg bg-[#181C26] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
                                aria-label="Disminuir ciega pequeña"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Ciega Pequeña (SB)" content="Apuesta obligatoria del jugador sentado a la izquierda del botón." className="flex-1 min-w-0">
                              <NumericInput
                                min={1}
                                value={lvl.smallBlind}
                                onChange={(val) =>
                                  onUpdateLevel(lvl.id, { smallBlind: val })
                                }
                                aria-label={`Ciega pequeña nivel ${playIdx}`}
                                className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-2 text-center text-sm font-mono-tabular text-white"
                              />
                            </Tooltip>
                            <Tooltip title="Subir Ciega Pequeña" content="Aumenta un paso el valor estándar de la ciega pequeña.">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLevel(lvl.id, {
                                    smallBlind: stepBlind(lvl.smallBlind, 1),
                                  })
                                }
                                className="min-h-[40px] min-w-[34px] flex items-center justify-center rounded-lg bg-[#181C26] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
                                aria-label="Aumentar ciega pequeña"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Big Blind with -/+ Steppers */}
                        <div className="md:col-span-3">
                          <label className="block md:hidden text-[11px] text-slate-400 mb-1">
                            Ciega grande
                          </label>
                          <div className="flex items-center gap-1">
                            <Tooltip title="Bajar Ciega Grande" content="Reduce un paso el valor estándar de la ciega grande.">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLevel(lvl.id, {
                                    bigBlind: stepBlind(lvl.bigBlind, -1),
                                  })
                                }
                                className="min-h-[40px] min-w-[34px] flex items-center justify-center rounded-lg bg-[#181C26] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
                                aria-label="Disminuir ciega grande"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip title="Ciega Grande (BB)" content="Apuesta mínima de entrada en la mano; normalmente el doble de la SB." className="flex-1 min-w-0">
                              <NumericInput
                                min={1}
                                value={lvl.bigBlind}
                                onChange={(val) =>
                                  onUpdateLevel(lvl.id, { bigBlind: val })
                                }
                                aria-label={`Ciega grande nivel ${playIdx}`}
                                className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-2 text-center text-sm font-mono-tabular text-white"
                              />
                            </Tooltip>
                            <Tooltip title="Subir Ciega Grande" content="Aumenta un paso el valor estándar de la ciega grande.">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateLevel(lvl.id, {
                                    bigBlind: stepBlind(lvl.bigBlind, 1),
                                  })
                                }
                                className="min-h-[40px] min-w-[34px] flex items-center justify-center rounded-lg bg-[#181C26] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
                                aria-label="Aumentar ciega grande"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Ante */}
                        <div className={`md:col-span-1 ${anteMode === 'none' ? 'opacity-40' : ''}`}>
                          <label className="block md:hidden text-[11px] text-slate-400 mb-1">
                            Ante
                          </label>
                          <Tooltip
                            title="Ante del nivel"
                            content="Fichas extra obligatorias para el bote en este nivel (si el modo Ante está activado arriba)."
                            className="w-full"
                          >
                            <NumericInput
                              min={0}
                              value={lvl.ante}
                              onChange={(val) => onUpdateLevel(lvl.id, { ante: val })}
                              aria-label={`Ante nivel ${playIdx}`}
                              className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-2 text-center text-sm font-mono-tabular text-slate-200"
                            />
                          </Tooltip>
                        </div>

                        {/* Minutes */}
                        <div className="md:col-span-1">
                          <label className="block md:hidden text-[11px] text-slate-400 mb-1">
                            Minutos
                          </label>
                          <Tooltip
                            title="Minutos del nivel"
                            content="Duración individual de este nivel en minutos."
                            className="w-full"
                          >
                            <NumericInput
                              min={1}
                              max={180}
                              value={lvl.durationMinutes}
                              onChange={(val) =>
                                onUpdateLevel(lvl.id, { durationMinutes: val })
                              }
                              aria-label={`Duración nivel ${playIdx}`}
                              className="min-h-[40px] w-full rounded-xl bg-[#0A0C10] border border-white/10 px-2 text-center text-sm font-mono-tabular text-slate-200"
                            />
                          </Tooltip>
                        </div>

                        {/* Desktop row actions */}
                        <div className="hidden md:flex md:col-span-2 items-center justify-end gap-1">
                          <Tooltip title="Subir nivel" content="Sube este nivel una posición en el orden.">
                            <button
                              type="button"
                              onClick={() => onMoveLevel(idx, -1)}
                              disabled={idx === 0}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Bajar nivel" content="Baja este nivel una posición en el orden.">
                            <button
                              type="button"
                              onClick={() => onMoveLevel(idx, 1)}
                              disabled={idx === levels.length - 1}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          <Tooltip title="Eliminar nivel" content="Elimina este nivel de la estructura.">
                            <button
                              type="button"
                              onClick={() => onRemoveLevel(lvl.id)}
                              disabled={levels.length <= 1}
                              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 sm:p-5 border-t border-white/[0.08] flex flex-wrap items-center gap-3 bg-[#0E1117]">
              <Tooltip
                title="Añadir nivel"
                content="Agrega una nueva ronda al final sugiriendo automáticamente las siguientes ciegas."
              >
                <button
                  type="button"
                  onClick={() => onAddLevel('level')}
                  className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer"
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir nivel</span>
                </button>
              </Tooltip>

              <Tooltip
                title="Añadir descanso"
                content="Inserta una pausa de descanso que puedes mover a cualquier posición con las flechas ↑ / ↓."
              >
                <button
                  type="button"
                  onClick={() => onAddLevel('break')}
                  className="min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-5 py-2.5 text-sm font-medium text-slate-200 transition-all cursor-pointer"
                >
                  <Coffee className="w-4 h-4 text-amber-300" />
                  <span>Añadir descanso</span>
                </button>
              </Tooltip>
            </div>
          </section>
        </>
      )}

      {/* SUB-TAB 2: VIRTUAL FICHAS, REBUYS & PRIZE PAYOUTS */}
      {subTab === 'money' && (
        <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Entradas, Rebuys, Add-ons y Premios (en fichas)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calcula automáticamente el bote total virtual en fichas y el reparto de premios en el reloj en vivo
              </p>
            </div>
            <span className="text-xs font-medium text-slate-300">
              Moneda virtual: <strong className="text-white">Fichas</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumberField
              label="Entrada inicial (fichas)"
              tooltip="Cantidad de fichas virtuales que aporta cada jugador al inscribirse."
              value={moneyConfig.buyIn}
              step={100}
              onChange={(v) => onUpdateMoneyConfig({ buyIn: v })}
            />
            <NumberField
              label="Comisión / Reserva de mesa (fichas)"
              tooltip="Fichas reservadas aparte del bote principal (para organización, ranking o mesa)."
              value={moneyConfig.tableFee}
              step={50}
              onChange={(v) => onUpdateMoneyConfig({ tableFee: v })}
            />
            <NumberField
              label="Nivel límite de rebuys (0 = sin rebuys)"
              tooltip="Hasta qué nivel de juego se permiten recompras. En el reloj verás la cuenta atrás para el fin de rebuys."
              value={moneyConfig.rebuyMaxLevel}
              onChange={(v) => onUpdateMoneyConfig({ rebuyMaxLevel: v })}
            />
            <NumberField
              label="Coste de Rebuy (fichas)"
              tooltip="Aportación en fichas virtuales sumada al bote por cada recompra."
              value={moneyConfig.rebuyCost}
              step={100}
              onChange={(v) => onUpdateMoneyConfig({ rebuyCost: v })}
            />
            <NumberField
              label="Fichas entregadas por Rebuy"
              tooltip="Fichas de juego que recibe el jugador en la mesa al hacer un Rebuy (actualiza el stack promedio)."
              value={moneyConfig.rebuyStack}
              step={500}
              onChange={(v) => onUpdateMoneyConfig({ rebuyStack: v })}
            />
            <NumberField
              label="Coste de Add-on (fichas)"
              tooltip="Aportación en fichas virtuales al bote por cada Add-on realizado."
              value={moneyConfig.addOnCost}
              step={100}
              onChange={(v) => onUpdateMoneyConfig({ addOnCost: v })}
            />
            <NumberField
              label="Fichas entregadas por Add-on"
              tooltip="Fichas extra de juego añadidas al stack del jugador tras un Add-on."
              value={moneyConfig.addOnStack}
              step={500}
              onChange={(v) => onUpdateMoneyConfig({ addOnStack: v })}
            />
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-white">
                  Estructura de premios (%)
                </span>
                {(() => {
                  const totalPct = moneyConfig.payoutPercentages.reduce((a, b) => a + b, 0);
                  return (
                    <span
                      className={`text-xs font-mono-tabular font-semibold ${
                        totalPct === 100 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      Total: {totalPct}%
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '1 puesto (100%)', arr: [100] },
                  { label: '2 puestos (65/35)', arr: [65, 35] },
                  { label: '3 puestos (50/30/20)', arr: [50, 30, 20] },
                  { label: '4 puestos (45/25/18/12)', arr: [45, 25, 18, 12] },
                ].map((preset) => (
                  <Tooltip
                    key={preset.label}
                    title={preset.label}
                    content="Aplica al instante esta plantilla de reparto porcentual al bote total de fichas."
                  >
                    <button
                      type="button"
                      onClick={() => onUpdateMoneyConfig({ payoutPercentages: preset.arr })}
                      className="min-h-[36px] px-3 rounded-lg bg-[#181C26] hover:bg-white/[0.1] border border-white/[0.06] text-xs text-slate-200 cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {moneyConfig.payoutPercentages.map((pct, idx) => (
                <Tooltip
                  key={idx}
                  title={`Premio ${idx + 1}.º puesto (%)`}
                  content="Porcentaje del bote total en fichas asignado a esta posición final."
                  className="w-full"
                >
                  <div className="w-full space-y-1">
                    <label className="text-xs text-slate-400">{idx + 1}.º puesto (%)</label>
                    <NumericInput
                      min={0}
                      max={100}
                      value={pct}
                      onChange={(val) => {
                        const next = [...moneyConfig.payoutPercentages];
                        next[idx] = val;
                        onUpdateMoneyConfig({ payoutPercentages: next });
                      }}
                      className="min-h-[42px] w-full rounded-xl bg-[#0A0C10] border border-white/15 px-3 text-sm font-mono-tabular text-white"
                    />
                  </div>
                </Tooltip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Tooltip
                title="Añadir puesto premiado"
                content="Agrega una posición más a la estructura de premios (hasta 8 puestos)."
              >
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMoneyConfig({
                      payoutPercentages: [...moneyConfig.payoutPercentages, 0],
                    })
                  }
                  disabled={moneyConfig.payoutPercentages.length >= 8}
                  className="min-h-[38px] px-3 rounded-lg bg-[#181C26] hover:bg-white/[0.1] disabled:opacity-35 border border-white/[0.06] text-xs font-medium text-slate-200 cursor-pointer"
                >
                  + Añadir puesto
                </button>
              </Tooltip>
              <Tooltip
                title="Quitar último puesto"
                content="Elimina la última posición de premios configurada."
              >
                <button
                  type="button"
                  onClick={() => {
                    if (moneyConfig.payoutPercentages.length <= 1) return;
                    onUpdateMoneyConfig({
                      payoutPercentages: moneyConfig.payoutPercentages.slice(0, -1),
                    });
                  }}
                  disabled={moneyConfig.payoutPercentages.length <= 1}
                  className="min-h-[38px] px-3 rounded-lg bg-[#181C26] hover:bg-white/[0.1] disabled:opacity-35 border border-white/[0.06] text-xs font-medium text-slate-200 cursor-pointer"
                >
                  - Quitar último puesto
                </button>
              </Tooltip>
            </div>
          </div>
        </section>
      )}

      {/* SUB-TAB 3: CHIP SET & STARTING STACK */}
      {subTab === 'chips' && (
        <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">
                Set de fichas y reparto inicial
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personaliza los colores y valores de tu maletín de fichas
              </p>
            </div>
            <Tooltip
              title="Añadir nueva ficha"
              content="Agrega otro color/valor de ficha a tu maletín para incluirlo en el reloj y el reparto."
            >
              <button
                type="button"
                onClick={onAddChip}
                className="min-h-[40px] flex items-center gap-1.5 rounded-xl px-4 text-xs sm:text-sm font-semibold text-white cursor-pointer"
                style={{ backgroundColor: palette.primaryHex }}
              >
                <Plus className="w-4 h-4" />
                <span>Añadir ficha</span>
              </button>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chips.map((chip) => (
              <div
                key={chip.id}
                className="flex items-center gap-3 rounded-xl bg-[#181C26] border border-white/[0.06] p-3"
              >
                <ChipBadge value={chip.value} color={chip.color} />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Tooltip title="Valor de la ficha" content="Cantidad de puntos o ciegas que representa esta ficha física.">
                      <NumericInput
                        min={1}
                        value={chip.value}
                        onChange={(val) => onUpdateChip(chip.id, { value: val })}
                        aria-label="Valor de ficha"
                        className="min-h-[36px] w-24 rounded-lg bg-[#0A0C10] border border-white/10 px-2.5 text-sm font-mono-tabular text-white"
                      />
                    </Tooltip>
                    <Tooltip title="Color de la ficha" content="Elige el color real de tu maletín para identificarla visualmente en la mesa.">
                      <input
                        type="color"
                        value={chip.color}
                        onChange={(e) => onUpdateChip(chip.id, { color: e.target.value })}
                        aria-label="Color de ficha"
                        className="h-9 w-10 rounded-lg bg-transparent cursor-pointer"
                      />
                    </Tooltip>
                  </div>
                </div>
                <Tooltip title="Eliminar ficha" content="Quita este tipo de ficha del set configurado.">
                  <button
                    type="button"
                    onClick={() => onRemoveChip(chip.id)}
                    disabled={chips.length <= 1}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-25 cursor-pointer"
                    aria-label="Eliminar ficha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/[0.08] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Stack inicial por jugador</div>
                <div className="text-xs text-slate-400">
                  Reparto automático sugerido con tus fichas actuales
                </div>
              </div>
              <Tooltip title="Stack inicial (fichas)" content="Total de puntos que recibe cada jugador al sentarse. Recalcula al instante el reparto sugerido abajo.">
                <NumericInput
                  min={100}
                  step={500}
                  value={startingStack}
                  onChange={(val) => onUpdateStartingStack(val)}
                  className="min-h-[42px] w-32 rounded-xl bg-[#0A0C10] border border-white/15 px-3 text-center text-sm font-mono-tabular text-white"
                />
              </Tooltip>
            </div>

            <Tooltip
              title="Desglose recomendado"
              content="Cuántas fichas físicas de cada color entregar a cada jugador para sumar su stack inicial."
              className="w-full block"
            >
              <div className="w-full flex flex-wrap items-center gap-4 rounded-xl bg-[#0A0C10] border border-white/[0.06] p-4">
                {startingBreakdown.map((b) => (
                  <ChipBadge key={b.value} value={b.value} color={b.color} count={b.count} />
                ))}
              </div>
            </Tooltip>
          </div>
        </section>
      )}

      {/* Quick Setup Wizard Modal */}
      <QuickSetupModal
        isOpen={showQuickSetup}
        chips={chips}
        currentTitle={tournamentTitle}
        themeColor={themeColor}
        onClose={() => setShowQuickSetup(false)}
        onApply={onApplyQuickSetup}
      />
    </div>
  );
};

const NumberField: React.FC<{
  label: string;
  tooltip: string;
  value: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, tooltip, value, step = 1, onChange }) => (
  <Tooltip title={label} content={tooltip} className="w-full">
    <div className="w-full">
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <NumericInput
        min={0}
        step={step}
        value={value}
        onChange={onChange}
        className="min-h-[42px] w-full rounded-xl bg-[#0A0C10] border border-white/15 px-3 text-sm font-mono-tabular text-white"
      />
    </div>
  </Tooltip>
);
