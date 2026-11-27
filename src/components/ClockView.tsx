import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Coffee,
  Users,
  Plus,
  Minus,
  AlertTriangle,
  AlarmClock,
  Undo2,
  Columns2,
  LayoutDashboard,
  Trophy,
  Award,
  X,
} from 'lucide-react';
import {
  BlindLevel,
  ChipDefinition,
  PokerSettings,
  StructurePreset,
  TableStats,
  TournamentMoneyConfig,
} from '../types/poker';
import { formatChipValue, formatFichas, formatTime } from '../hooks/usePokerClock';
import {
  calculateChipDistribution,
  HAND_RANKINGS,
  THEME_PALETTES,
} from '../data/presets';
import { ChipBadge } from './ChipBadge';

interface ClockViewProps {
  tournamentTitle: string;
  onUpdateTitle: (title: string) => void;
  activePreset: StructurePreset;
  levels: BlindLevel[];
  currentLevelIndex: number;
  currentLevel: BlindLevel;
  previousLevel: BlindLevel | null;
  nextLevel: BlindLevel | null;
  playLevelNumber: number;
  secondsRemaining: number;
  totalElapsedSeconds: number;
  secondsToNextBreak: number | null;
  secondsToRebuyEnd: number | null;
  progressRatio: number;
  isRunning: boolean;
  isOneMinuteWarning: boolean;
  settings: PokerSettings;
  tableStats: TableStats;
  moneyConfig: TournamentMoneyConfig;
  chips: ChipDefinition[];
  prizePool: number;
  payoutBreakdown: { place: number; percentage: number; amount: number }[];
  averageStack: number;
  averageBigBlinds: number | null;
  lastAlertBanner: string | null;
  isFullscreen: boolean;
  shotClockActive: boolean;
  shotClockRemaining: number;
  undoCount: number;
  onStartShotClock: () => void;
  onStopShotClock: () => void;
  onUndoTableAction: () => void;
  onQuickAddPlayer: () => void;
  onQuickEliminatePlayer: () => void;
  onQuickAddRebuy: () => void;
  onQuickAddAddOn: () => void;
  onToggleFullscreen: () => void;
  onToggleDisplayMode: () => void;
  onTogglePlayPause: () => void;
  onNextLevel: () => void;
  onPrevLevel: () => void;
  onJumpToLevel: (idx: number) => void;
  onResetCurrentLevel: () => void;
  onResetTournament: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  onScrubProgress: (ratio: number) => void;
  onToggleMute: () => void;
  onUpdateTableStats: (patch: Partial<TableStats>) => void;
}

export const ClockView: React.FC<ClockViewProps> = ({
  tournamentTitle,
  onUpdateTitle,
  activePreset,
  levels,
  currentLevelIndex,
  currentLevel,
  previousLevel,
  nextLevel,
  playLevelNumber,
  secondsRemaining,
  totalElapsedSeconds,
  secondsToNextBreak,
  secondsToRebuyEnd,
  progressRatio,
  isRunning,
  isOneMinuteWarning,
  settings,
  tableStats,
  moneyConfig,
  chips,
  prizePool,
  payoutBreakdown,
  averageStack,
  averageBigBlinds,
  lastAlertBanner,
  isFullscreen,
  shotClockActive,
  shotClockRemaining,
  undoCount,
  onStartShotClock,
  onStopShotClock,
  onUndoTableAction,
  onQuickAddPlayer,
  onQuickEliminatePlayer,
  onQuickAddRebuy,
  onQuickAddAddOn,
  onToggleFullscreen,
  onToggleDisplayMode,
  onTogglePlayPause,
  onNextLevel,
  onPrevLevel,
  onJumpToLevel,
  onResetCurrentLevel,
  onResetTournament,
  onAdjustTime,
  onScrubProgress,
  onToggleMute,
  onUpdateTableStats,
}) => {
  const [confirmResetTourney, setConfirmResetTourney] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [showHandsModal, setShowHandsModal] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);

  const palette = THEME_PALETTES[settings.themeColor];
  const isBreak = currentLevel.type === 'break';
  const isCritical10s = secondsRemaining <= 10 && secondsRemaining > 0 && isRunning;
  const anteActive = settings.anteMode !== 'none';
  const anteLabel = settings.anteMode === 'big_blind' ? 'BB Ante' : 'Ante';

  const showPreGameIntro =
    settings.preGameIntroEnabled &&
    !introDismissed &&
    !isRunning &&
    currentLevelIndex === 0 &&
    secondsRemaining === currentLevel.durationMinutes * 60;

  const timerColorClass = isBreak
    ? 'text-amber-300'
    : isCritical10s
      ? 'text-rose-400'
      : isOneMinuteWarning
        ? 'text-amber-400'
        : 'text-slate-50';

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / Math.max(1, rect.width);
    onScrubProgress(ratio);
  };

  // Pre-Game Intro Screen
  if (showPreGameIntro) {
    const breakdown = calculateChipDistribution(
      tableStats.startingStack,
      currentLevel.smallBlind || 25,
      chips
    );
    return (
      <section className="max-w-3xl mx-auto rounded-2xl bg-[#12151C] border border-white/[0.08] p-6 sm:p-10 text-center space-y-6">
        <div className="text-xs font-medium text-slate-400">
          Bienvenida al torneo · {activePreset.name}
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
          {tournamentTitle}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl bg-[#181C26] border border-white/[0.06] p-3.5">
            <div className="text-xs text-slate-400">Stack inicial</div>
            <div className="text-lg font-bold font-mono-tabular text-white mt-0.5">
              {formatChipValue(tableStats.startingStack)}
            </div>
          </div>
          <div className="rounded-xl bg-[#181C26] border border-white/[0.06] p-3.5">
            <div className="text-xs text-slate-400">Ciegas iniciales</div>
            <div className="text-lg font-bold font-mono-tabular text-white mt-0.5">
              {formatChipValue(currentLevel.smallBlind)}/{formatChipValue(currentLevel.bigBlind)}
            </div>
          </div>
          <div className="rounded-xl bg-[#181C26] border border-white/[0.06] p-3.5">
            <div className="text-xs text-slate-400">Entrada</div>
            <div className="text-lg font-bold font-mono-tabular text-white mt-0.5">
              {formatFichas(moneyConfig.buyIn)}
            </div>
          </div>
          <div className="rounded-xl bg-[#181C26] border border-white/[0.06] p-3.5">
            <div className="text-xs text-slate-400">Duración nivel</div>
            <div className="text-lg font-bold font-mono-tabular text-white mt-0.5">
              {currentLevel.durationMinutes} min
            </div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="rounded-xl bg-[#0A0C10] border border-white/[0.06] p-4 space-y-3">
            <div className="text-xs font-medium text-slate-400">
              Fichas iniciales por jugador
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {breakdown.map((b) => (
                <ChipBadge key={b.value} value={b.value} color={b.color} count={b.count} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setIntroDismissed(true);
              onTogglePlayPause();
            }}
            className="min-h-[56px] px-8 rounded-2xl text-base font-semibold text-white flex items-center gap-2.5 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
            style={{ backgroundColor: palette.primaryHex }}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Comenzar partida</span>
          </button>
          <button
            type="button"
            onClick={() => setIntroDismissed(true)}
            className="min-h-[56px] px-5 rounded-2xl bg-[#181C26] border border-white/[0.08] text-sm font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            Abrir reloj en pausa
          </button>
        </div>
      </section>
    );
  }

  // Minimalist Table Split Mode (Portrait: Top/Bottom, Landscape/Desktop: Left/Right)
  if (settings.clockDisplayMode === 'minimal') {
    return (
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 bg-[#0A0C10] flex flex-col'
            : 'rounded-2xl overflow-hidden border border-white/[0.1] min-h-[70vh] flex flex-col relative'
        }
      >
        <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2">
          {/* Small Blind Half */}
          <div
            className="flex flex-col items-center justify-center p-6 sm:p-10 text-center"
            style={{ backgroundColor: palette.splitLeftBg }}
          >
            <span className="text-xs sm:text-sm font-semibold tracking-widest text-white/75 uppercase">
              {isBreak ? 'Estado' : 'Small Blind'}
            </span>
            <div className="mt-2 font-mono-tabular font-bold text-white leading-none text-[clamp(4.5rem,17vw,10rem)] select-none">
              {isBreak ? 'PAUSA' : formatChipValue(currentLevel.smallBlind)}
            </div>
          </div>

          {/* Big Blind Half */}
          <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-[#12151C]">
            <span className="text-xs sm:text-sm font-semibold tracking-widest text-slate-400 uppercase">
              {isBreak ? 'Descanso' : 'Big Blind'}
            </span>
            <div className="mt-2 font-mono-tabular font-bold text-white leading-none text-[clamp(4.5rem,17vw,10rem)] select-none">
              {isBreak ? `${currentLevel.durationMinutes}m` : formatChipValue(currentLevel.bigBlind)}
            </div>
          </div>

          {/* Floating Center Timer Capsule */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
            <div className="pointer-events-auto flex items-center gap-3 sm:gap-5 rounded-3xl bg-[#0A0C10]/95 border border-white/15 px-4 py-3 sm:px-6 sm:py-4 shadow-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={onPrevLevel}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                aria-label="Nivel anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onTogglePlayPause}
                className="text-center cursor-pointer px-2"
                title={isRunning ? 'Pulsa para pausar' : 'Pulsa para iniciar'}
              >
                <div
                  className={`font-mono-tabular font-bold text-3xl sm:text-5xl leading-none ${timerColorClass}`}
                >
                  {formatTime(secondsRemaining)}
                </div>
                <div className="mt-1 text-[11px] font-medium text-slate-400">
                  {isRunning ? 'En marcha · Toca para pausar' : 'Pausado · Toca para iniciar'}
                </div>
              </button>

              <button
                type="button"
                onClick={onNextLevel}
                disabled={currentLevelIndex >= levels.length - 1}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 cursor-pointer"
                aria-label="Siguiente nivel"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top Left/Right Floating Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onResetCurrentLevel}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-black/45 hover:bg-black/65 text-white cursor-pointer"
                aria-label="Reiniciar nivel"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onStartShotClock}
                className="min-h-[42px] px-3 flex items-center gap-1.5 rounded-xl bg-black/45 hover:bg-black/65 text-xs font-semibold text-white cursor-pointer"
              >
                <AlarmClock className="w-4 h-4" />
                <span>Clock</span>
              </button>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-black/45 hover:bg-black/65 text-white cursor-pointer"
                aria-label={settings.soundEnabled ? 'Silenciar' : 'Activar sonido'}
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
              <button
                type="button"
                onClick={onToggleDisplayMode}
                className="min-h-[42px] px-3 flex items-center gap-1.5 rounded-xl bg-black/45 hover:bg-black/65 text-xs font-medium text-white cursor-pointer"
                title="Volver a vista completa"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Estándar</span>
              </button>
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-black/45 hover:bg-black/65 text-white cursor-pointer"
                aria-label="Pantalla completa"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Ante Strip */}
          {anteActive && !isBreak && (
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <span className="inline-block rounded-xl bg-black/55 px-4 py-1.5 text-sm sm:text-base font-mono-tabular font-bold text-white">
                {anteLabel}: {formatChipValue(currentLevel.ante)}
              </span>
            </div>
          )}
        </div>

        {/* Shot Clock Modal in Minimal Mode */}
        {shotClockActive && (
          <ShotClockOverlay
            remaining={shotClockRemaining}
            total={settings.shotClockSeconds}
            onRestart={onStartShotClock}
            onClose={onStopShotClock}
          />
        )}
      </div>
    );
  }

  // Standard & Fullscreen TV Clock Panel
  const renderMainClockPanel = (fullscreenMode: boolean) => (
    <section
      className={
        fullscreenMode
          ? 'flex flex-col justify-between h-full w-full max-w-6xl mx-auto px-6 py-6 sm:px-10 sm:py-8'
          : 'flex flex-col justify-between rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-7'
      }
    >
      {/* Top contextual strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {editingTitle ? (
            <input
              type="text"
              value={tournamentTitle}
              onChange={(e) => onUpdateTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingTitle(false);
              }}
              autoFocus
              className="rounded-lg bg-[#0A0C10] border border-white/20 px-2.5 py-1 text-sm font-semibold text-white focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors truncate block cursor-pointer"
              title="Haz clic para editar el nombre del torneo"
            >
              {tournamentTitle}
            </button>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-medium text-slate-300 mt-0.5">
            {isBreak ? (
              <span className="flex items-center gap-2 text-amber-300 font-semibold">
                <Coffee className="w-4 h-4 shrink-0" />
                <span>{currentLevel.label || 'Descanso'}</span>
              </span>
            ) : (
              <span className="text-white font-semibold whitespace-nowrap">
                Nivel {playLevelNumber}
              </span>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400 truncate">{activePreset.name}</span>
            {isOneMinuteWarning && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-amber-400 font-semibold whitespace-nowrap">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Último minuto
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onStartShotClock}
            className="min-h-[42px] px-3 flex items-center gap-1.5 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
            title="Activar reloj de decisión (Call the Clock)"
          >
            <AlarmClock className="w-4 h-4" />
            <span className="hidden sm:inline">Call Clock</span>
          </button>

          <button
            type="button"
            onClick={onToggleDisplayMode}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Cambiar a Vista Mesa Minimalista"
            aria-label="Cambiar a Vista Mesa Minimalista"
          >
            <Columns2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label={settings.soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label={fullscreenMode ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {fullscreenMode ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Live audio event feedback toast */}
      {lastAlertBanner && (
        <div className="mt-3 text-center text-xs sm:text-sm font-medium text-amber-300">
          {lastAlertBanner}
        </div>
      )}

      {/* Giant Countdown Timer */}
      <div className="my-4 sm:my-7 text-center">
        <div
          className={`font-mono-tabular font-bold tracking-tight leading-none select-none transition-colors duration-200 ${timerColorClass} ${
            fullscreenMode
              ? 'text-[clamp(4.5rem,17vw,10.5rem)]'
              : 'text-[clamp(3.75rem,14vw,7rem)]'
          }`}
        >
          {formatTime(secondsRemaining)}
        </div>

        {/* Interactive Progress Bar */}
        <div className="mt-4 sm:mt-6 max-w-xl mx-auto">
          <div
            onClick={handleBarClick}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onAdjustTime(-30);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onAdjustTime(30);
              }
            }}
            role="slider"
            aria-label="Progreso del nivel"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressRatio * 100)}
            tabIndex={0}
            className="h-3 w-full rounded-full bg-white/[0.07] overflow-hidden cursor-pointer relative"
            title="Haz clic para ajustar el tiempo del nivel"
          >
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${progressRatio * 100}%`,
                backgroundColor: isBreak ? '#FBBF24' : palette.primaryHex,
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono-tabular">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAdjustTime(-60)}
                className="min-h-[34px] px-2 rounded-lg hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                -1m
              </button>
              <button
                type="button"
                onClick={() => onAdjustTime(60)}
                className="min-h-[34px] px-2 rounded-lg hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={onResetCurrentLevel}
                className="min-h-[34px] px-2 flex items-center gap-1 rounded-lg hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {secondsToNextBreak !== null && (
                <span>Descanso en {formatTime(secondsToNextBreak)}</span>
              )}
              {secondsToRebuyEnd !== null && (
                <span>
                  {secondsToRebuyEnd > 0
                    ? `Rebuys: ${formatTime(secondsToRebuyEnd)}`
                    : 'Rebuys cerrados'}
                </span>
              )}
              <span>Total: {formatTime(totalElapsedSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Playback Controls */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <button
          type="button"
          onClick={onPrevLevel}
          className="min-h-[54px] min-w-[54px] sm:min-h-[60px] sm:min-w-[60px] flex items-center justify-center rounded-2xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] text-slate-200 active:scale-[0.96] transition-all cursor-pointer"
          aria-label="Nivel anterior"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={onTogglePlayPause}
          className="min-h-[62px] min-w-[148px] sm:min-h-[70px] sm:min-w-[184px] flex items-center justify-center gap-3 rounded-2xl text-white font-semibold text-base sm:text-lg shadow-lg transition-all active:scale-[0.97] cursor-pointer px-6"
          style={{ backgroundColor: palette.primaryHex }}
          aria-label={isRunning ? 'Pausar reloj' : 'Iniciar reloj'}
        >
          {isRunning ? (
            <>
              <Pause className="w-6 h-6 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              <span>Iniciar</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onNextLevel}
          disabled={currentLevelIndex >= levels.length - 1}
          className="min-h-[54px] min-w-[54px] sm:min-h-[60px] sm:min-w-[60px] flex items-center justify-center rounded-2xl bg-[#181C26] hover:bg-[#222735] disabled:opacity-35 disabled:pointer-events-none border border-white/[0.08] text-slate-200 active:scale-[0.96] transition-all cursor-pointer"
          aria-label="Siguiente nivel"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Previous / Current / Next Blinds + Ante Readout */}
      <div className="mt-6 sm:mt-7 pt-5 border-t border-white/[0.08]">
        {isBreak ? (
          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-amber-300/90">Pausa programada en mesa</p>
            <p className="text-2xl sm:text-4xl font-bold text-white">
              {currentLevel.label || 'Descanso'} · {currentLevel.durationMinutes} min
            </p>
            {nextLevel && (
              <p className="text-sm sm:text-base text-slate-400">
                Al volver: {formatChipValue(nextLevel.smallBlind)} /{' '}
                {formatChipValue(nextLevel.bigBlind)}
                {anteActive && nextLevel.ante > 0
                  ? ` · ${anteLabel} ${formatChipValue(nextLevel.ante)}`
                  : ''}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`grid gap-5 ${
                anteActive ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'
              } items-center text-center`}
            >
              <div className={anteActive ? 'sm:col-span-2' : ''}>
                <div className="text-xs sm:text-sm font-medium text-slate-400">
                  Ciegas actuales
                </div>
                <div
                  className={`mt-1 font-mono-tabular font-bold text-white tracking-tight ${
                    fullscreenMode ? 'text-5xl sm:text-7xl' : 'text-4xl sm:text-6xl'
                  }`}
                >
                  {formatChipValue(currentLevel.smallBlind)} /{' '}
                  {formatChipValue(currentLevel.bigBlind)}
                </div>
              </div>

              {anteActive && (
                <div className="pt-3 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-white/[0.08]">
                  <div className="text-xs sm:text-sm font-medium text-slate-400">
                    {anteLabel}
                  </div>
                  <div
                    className={`mt-1 font-mono-tabular font-bold text-slate-100 ${
                      fullscreenMode ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'
                    }`}
                  >
                    {formatChipValue(currentLevel.ante)}
                  </div>
                </div>
              )}
            </div>

            {/* Previous & Next Blinds Row */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/[0.06] text-center font-mono-tabular">
              <div>
                <div className="text-[11px] font-sans text-slate-500">Anterior</div>
                <div className="text-sm sm:text-base font-semibold text-slate-400 mt-0.5">
                  {previousLevel
                    ? `${formatChipValue(previousLevel.smallBlind)} / ${formatChipValue(previousLevel.bigBlind)}`
                    : '—'}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-sans text-slate-500">Siguiente</div>
                <div className="text-sm sm:text-base font-semibold text-slate-200 mt-0.5">
                  {nextLevel ? (
                    nextLevel.type === 'break' ? (
                      <span className="text-amber-300">
                        {nextLevel.label || 'Descanso'} ({nextLevel.durationMinutes}m)
                      </span>
                    ) : (
                      `${formatChipValue(nextLevel.smallBlind)} / ${formatChipValue(nextLevel.bigBlind)}${
                        anteActive && nextLevel.ante > 0 ? ` (${formatChipValue(nextLevel.ante)})` : ''
                      }`
                    )
                  ) : (
                    'Último nivel'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Chip Legend & Hand Rankings Strip */}
      {fullscreenMode && (settings.showChipLegend || settings.showPayoutsOnClock) && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          {settings.showChipLegend && (
            <div className="flex flex-wrap items-center gap-3">
              {chips.map((c) => (
                <ChipBadge key={c.id} value={c.value} color={c.color} />
              ))}
            </div>
          )}
          {settings.showPayoutsOnClock && (
            <div className="text-sm font-mono-tabular text-slate-200 flex flex-wrap items-center gap-4">
              <span>
                Bote:{' '}
                <strong className="text-emerald-400">{formatFichas(prizePool)}</strong>
              </span>
              {payoutBreakdown.map((p) => (
                <span key={p.place}>
                  {p.place}.º <strong>{formatFichas(p.amount)}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0C10] overflow-y-auto">
        {renderMainClockPanel(true)}
        {shotClockActive && (
          <ShotClockOverlay
            remaining={shotClockRemaining}
            total={settings.shotClockSeconds}
            onRestart={onStartShotClock}
            onClose={onStopShotClock}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Focal Zone */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {renderMainClockPanel(false)}

          {/* Quick Live Table Controls (+Player / +Rebuy / +Add-on / -Player / Undo) */}
          {settings.showTableStats && (
            <div className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-4 sm:p-5 space-y-4">
              <TableStatsBlock
                tableStats={tableStats}
                averageStack={averageStack}
                averageBigBlinds={averageBigBlinds}
                undoCount={undoCount}
                onUndo={onUndoTableAction}
                onQuickAddPlayer={onQuickAddPlayer}
                onQuickEliminatePlayer={onQuickEliminatePlayer}
                onQuickAddRebuy={onQuickAddRebuy}
                onQuickAddAddOn={onQuickAddAddOn}
                onUpdate={onUpdateTableStats}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar: Prize Pool, Chips, Hand Rankings, Level Ladder */}
        <aside className="lg:col-span-4 flex flex-col gap-5">
          {settings.showPayoutsOnClock && (
            <div className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Bote y premios</span>
                </div>
                <span className="text-lg font-bold font-mono-tabular text-emerald-400">
                  {formatFichas(prizePool)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {payoutBreakdown.map((p) => (
                  <div
                    key={p.place}
                    className="rounded-xl bg-[#181C26] border border-white/[0.06] py-2 px-1"
                  >
                    <div className="text-[11px] text-slate-400">{p.place}.º ({p.percentage}%)</div>
                    <div className="text-sm font-bold font-mono-tabular text-white">
                      {formatChipValue(p.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500">fichas</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settings.showChipLegend && (
            <div className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Fichas en mesa</span>
                <button
                  type="button"
                  onClick={() => setShowHandsModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Guía de manos</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {chips.map((c) => (
                  <ChipBadge key={c.id} value={c.value} color={c.color} />
                ))}
              </div>
            </div>
          )}

          {settings.showHandRankings && (
            <div className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Orden de manos</span>
              </div>
              <div className="space-y-1 text-xs">
                {HAND_RANKINGS.map((h) => (
                  <div key={h.rank} className="flex items-center justify-between text-slate-300">
                    <span>
                      {h.rank}. {h.name}
                    </span>
                    <span className="font-mono-tabular text-slate-400">{h.example}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Levels Ladder */}
          <div className="flex-1 flex flex-col rounded-2xl bg-[#12151C] border border-white/[0.08] p-5">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <h2 className="text-sm font-semibold text-white">Progresión de niveles</h2>
              {!confirmResetTourney ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetTourney(true)}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  Reiniciar partida
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetTournament();
                      setConfirmResetTourney(false);
                    }}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetTourney(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {levels.map((lvl, idx) => {
                const isCurrent = idx === currentLevelIndex;
                const isPast = idx < currentLevelIndex;
                let playIdx = 0;
                for (let j = 0; j <= idx; j++) {
                  if (levels[j].type === 'level') playIdx++;
                }

                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onJumpToLevel(idx)}
                    className={`w-full min-h-[42px] flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                      isCurrent
                        ? 'text-white border'
                        : isPast
                          ? 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                          : 'text-slate-200 hover:bg-white/[0.04]'
                    }`}
                    style={
                      isCurrent
                        ? {
                            backgroundColor: palette.softBgHex,
                            borderColor: palette.borderHex,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono-tabular text-xs w-7 text-slate-400 shrink-0">
                        {lvl.type === 'break' ? 'DES' : `N${playIdx}`}
                      </span>
                      {lvl.type === 'break' ? (
                        <span className="text-amber-300 font-medium truncate">
                          {lvl.label || 'Descanso'}
                        </span>
                      ) : (
                        <span className="font-mono-tabular font-semibold whitespace-nowrap">
                          {formatChipValue(lvl.smallBlind)}/{formatChipValue(lvl.bigBlind)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-tabular shrink-0">
                      {lvl.type === 'level' && anteActive && lvl.ante > 0 && (
                        <span>A {formatChipValue(lvl.ante)}</span>
                      )}
                      <span>{lvl.durationMinutes}m</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Shot Clock Overlay */}
      {shotClockActive && (
        <ShotClockOverlay
          remaining={shotClockRemaining}
          total={settings.shotClockSeconds}
          onRestart={onStartShotClock}
          onClose={onStopShotClock}
        />
      )}

      {/* Hand Rankings Quick Modal */}
      {showHandsModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#12151C] border border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Orden de manos de póker</h3>
              <button
                type="button"
                onClick={() => setShowHandsModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer"
                aria-label="Cerrar guía de manos"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {HAND_RANKINGS.map((h) => (
                <div key={h.rank} className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div>
                    <div className="font-semibold text-white">
                      {h.rank}. {h.name}
                    </div>
                    <div className="text-xs text-slate-400">{h.desc}</div>
                  </div>
                  <div className="font-mono-tabular text-slate-200 whitespace-nowrap">
                    {h.example}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ShotClockOverlayProps {
  remaining: number;
  total: number;
  onRestart: () => void;
  onClose: () => void;
}

const ShotClockOverlay: React.FC<ShotClockOverlayProps> = ({
  remaining,
  total,
  onRestart,
  onClose,
}) => {
  const ratio = Math.max(0, Math.min(1, remaining / Math.max(1, total)));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#12151C] border border-amber-500/40 p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="flex items-center justify-center gap-2 text-amber-300 font-semibold text-sm">
          <AlarmClock className="w-5 h-5" />
          <span>¡Tiempo! (Call the Clock)</span>
        </div>

        <div
          className={`font-mono-tabular font-bold text-7xl sm:text-8xl leading-none ${
            remaining <= 5 ? 'text-rose-500' : 'text-white'
          }`}
        >
          {remaining}s
        </div>

        <div className="h-3 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              remaining <= 5 ? 'bg-rose-500' : 'bg-amber-400'
            }`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="min-h-[48px] px-5 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/10 text-sm font-semibold text-white cursor-pointer"
          >
            Reiniciar ({total}s)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

interface TableStatsBlockProps {
  tableStats: TableStats;
  averageStack: number;
  averageBigBlinds: number | null;
  undoCount: number;
  onUndo: () => void;
  onQuickAddPlayer: () => void;
  onQuickEliminatePlayer: () => void;
  onQuickAddRebuy: () => void;
  onQuickAddAddOn: () => void;
  onUpdate: (patch: Partial<TableStats>) => void;
}

const TableStatsBlock: React.FC<TableStatsBlockProps> = ({
  tableStats,
  averageStack,
  averageBigBlinds,
  undoCount,
  onUndo,
  onQuickAddPlayer,
  onQuickEliminatePlayer,
  onQuickAddRebuy,
  onQuickAddAddOn,
  onUpdate,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Users className="w-4 h-4 text-slate-400" />
          <span>Control de mesa en vivo</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono-tabular">
          <span>
            Stack prom: <strong className="text-white">{formatChipValue(averageStack)}</strong>
            {averageBigBlinds !== null && <span> ({averageBigBlinds} BB)</span>}
          </span>
          {undoCount > 0 && (
            <button
              type="button"
              onClick={onUndo}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-sans cursor-pointer"
              title="Deshacer último cambio de mesa"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono-tabular">
        <div className="rounded-xl bg-[#181C26] border border-white/[0.06] py-2 px-3">
          <div className="text-[11px] font-sans text-slate-400">En juego</div>
          <div className="text-base font-bold text-white">
            {tableStats.playersRemaining} / {tableStats.totalEntries}
          </div>
        </div>
        <div className="rounded-xl bg-[#181C26] border border-white/[0.06] py-2 px-3">
          <div className="text-[11px] font-sans text-slate-400">Rebuys</div>
          <div className="text-base font-bold text-white">{tableStats.totalRebuys}</div>
        </div>
        <div className="rounded-xl bg-[#181C26] border border-white/[0.06] py-2 px-3">
          <div className="text-[11px] font-sans text-slate-400">Add-ons</div>
          <div className="text-base font-bold text-white">{tableStats.totalAddOns}</div>
        </div>
        <div className="rounded-xl bg-[#181C26] border border-white/[0.06] py-2 px-3">
          <div className="text-[11px] font-sans text-slate-400">Knockouts</div>
          <div className="text-base font-bold text-white">{tableStats.totalKnockouts}</div>
        </div>
      </div>

      {/* Quick +Player / +Rebuy / +Add-on / -Player buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={onQuickAddPlayer}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs sm:text-sm font-semibold text-emerald-300 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Jugador</span>
        </button>

        <button
          type="button"
          onClick={onQuickAddRebuy}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Rebuy</span>
        </button>

        <button
          type="button"
          onClick={onQuickAddAddOn}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add-on</span>
        </button>

        <button
          type="button"
          onClick={onQuickEliminatePlayer}
          disabled={tableStats.playersRemaining <= 1}
          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-35 border border-rose-500/30 text-xs sm:text-sm font-semibold text-rose-300 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
          <span>Jugador</span>
        </button>
      </div>

      {/* Manual fine adjusters */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
        <span>Stack inicial: {formatFichas(tableStats.startingStack)}</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdate({
                totalEntries: Math.max(
                  tableStats.playersRemaining,
                  tableStats.totalEntries - 1
                ),
              })
            }
            className="hover:text-white cursor-pointer"
          >
            -1 Entrada
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ totalRebuys: Math.max(0, tableStats.totalRebuys - 1) })
            }
            className="hover:text-white cursor-pointer"
          >
            -1 Rebuy
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ totalAddOns: Math.max(0, tableStats.totalAddOns - 1) })
            }
            className="hover:text-white cursor-pointer"
          >
            -1 Add-on
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() =>
              onUpdate({ totalKnockouts: Math.max(0, tableStats.totalKnockouts - 1) })
            }
            className="hover:text-white cursor-pointer"
          >
            -1 KO
          </button>
        </div>
      </div>
    </div>
  );
};
