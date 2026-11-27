import { useEffect, useState } from 'react';
import {
  Timer,
  ListOrdered,
  Trophy,
  Calculator,
  Settings,
  WifiOff,
  Maximize2,
} from 'lucide-react';
import { AppTab } from './types/poker';
import { THEME_PALETTES } from './data/presets';
import { formatChipValue, formatTime, usePokerClock } from './hooks/usePokerClock';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useWakeLock } from './hooks/useWakeLock';
import { ClockView } from './components/ClockView';
import { StructureView } from './components/StructureView';
import { LeagueView } from './components/LeagueView';
import { SidePotCalculatorView } from './components/SidePotCalculatorView';
import { SettingsView } from './components/SettingsView';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('clock');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isOnline = useOnlineStatus();

  const clock = usePokerClock();
  const palette = THEME_PALETTES[clock.settings.themeColor];

  useWakeLock(clock.isRunning && clock.settings.keepScreenAwake);

  useEffect(() => {
    const timeStr = formatTime(clock.secondsRemaining);
    if (clock.currentLevel.type === 'break') {
      document.title = `${timeStr} · Descanso — MesaPoker`;
    } else {
      document.title = `${timeStr} · ${formatChipValue(clock.currentLevel.smallBlind)}/${formatChipValue(clock.currentLevel.bigBlind)} — MesaPoker`;
    }
  }, [clock.secondsRemaining, clock.currentLevel]);

  const { togglePlayPause, goToNextLevel, goToPrevLevel } = clock;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight' && activeTab === 'clock') {
        e.preventDefault();
        goToNextLevel();
      } else if (e.key === 'ArrowLeft' && activeTab === 'clock') {
        e.preventDefault();
        goToPrevLevel();
      } else if (e.key.toLowerCase() === 'f' && activeTab === 'clock') {
        e.preventDefault();
        setIsFullscreen((v) => !v);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, goToNextLevel, goToPrevLevel, activeTab, isFullscreen]);

  const toggleFullscreen = async () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    try {
      if (next && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!next && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Fallback gracefully to CSS viewport fullscreen
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const navItems: { id: AppTab; label: string; mobileLabel: string; icon: typeof Timer }[] = [
    { id: 'clock', label: 'Reloj', mobileLabel: 'Reloj', icon: Timer },
    { id: 'structure', label: 'Estructura', mobileLabel: 'Niveles', icon: ListOrdered },
    { id: 'league', label: 'Liga', mobileLabel: 'Liga', icon: Trophy },
    { id: 'tools', label: 'Botes', mobileLabel: 'Botes', icon: Calculator },
    { id: 'settings', label: 'Ajustes', mobileLabel: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 flex flex-col">
      {/* Desktop Top Navigation Bar (3-zone contract) */}
      <header className="hidden md:flex items-center justify-between gap-8 px-6 lg:px-10 h-16 border-b border-white/[0.08] bg-[#0A0C10]/90 backdrop-blur-md sticky top-0 z-30">
        <a
          href="#reloj"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('clock');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          MesaPoker
        </a>

        <nav className="flex items-center gap-7 text-sm font-medium" aria-label="Navegación principal">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white border-transparent'
                }`}
                style={active ? { borderBottomColor: palette.primaryHex } : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton variant="header" />
          <button
            type="button"
            onClick={() => {
              setActiveTab('clock');
              toggleFullscreen();
            }}
            className="min-h-[40px] flex items-center gap-2 rounded-lg bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Modo TV</span>
          </button>
        </div>
      </header>

      {/* Mobile Top Bar (Compact 52px) */}
      <header className="flex md:hidden items-center justify-between px-4 h-[52px] border-b border-white/[0.08] bg-[#0A0C10]/90 backdrop-blur-md sticky top-0 z-30">
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          MesaPoker
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="header" />
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-7 pb-24 md:pb-10">
        {!isOnline && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-[#181C26] border border-amber-500/30 px-4 py-2.5 text-xs sm:text-sm text-amber-200">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sin conexión a internet · Modo offline activo con guardado local</span>
          </div>
        )}

        {clock.storageError && (
          <div className="mb-4 rounded-xl bg-rose-950/50 border border-rose-500/40 px-4 py-2.5 text-xs sm:text-sm text-rose-200">
            {clock.storageError}
          </div>
        )}

        {activeTab === 'clock' && (
          <ClockView
            tournamentTitle={clock.tournamentTitle}
            onUpdateTitle={clock.setTournamentTitle}
            activePreset={clock.activePreset}
            levels={clock.levels}
            currentLevelIndex={clock.currentLevelIndex}
            currentLevel={clock.currentLevel}
            previousLevel={clock.previousLevel}
            nextLevel={clock.nextLevel}
            playLevelNumber={clock.playLevelNumber}
            secondsRemaining={clock.secondsRemaining}
            totalElapsedSeconds={clock.totalElapsedSeconds}
            secondsToNextBreak={clock.secondsToNextBreak}
            secondsToRebuyEnd={clock.secondsToRebuyEnd}
            progressRatio={clock.progressRatio}
            isRunning={clock.isRunning}
            isOneMinuteWarning={clock.isOneMinuteWarning}
            settings={clock.settings}
            tableStats={clock.tableStats}
            moneyConfig={clock.moneyConfig}
            chips={clock.chips}
            prizePool={clock.prizePool}
            payoutBreakdown={clock.payoutBreakdown}
            averageStack={clock.averageStack}
            averageBigBlinds={clock.averageBigBlinds}
            lastAlertBanner={clock.lastAlertBanner}
            isFullscreen={isFullscreen}
            shotClockActive={clock.shotClockActive}
            shotClockRemaining={clock.shotClockRemaining}
            undoCount={clock.undoCount}
            onStartShotClock={clock.startShotClock}
            onStopShotClock={clock.stopShotClock}
            onUndoTableAction={clock.undoLastTableAction}
            onQuickAddPlayer={clock.quickAddPlayer}
            onQuickEliminatePlayer={clock.quickEliminatePlayer}
            onQuickAddRebuy={clock.quickAddRebuy}
            onQuickAddAddOn={clock.quickAddAddOn}
            onToggleFullscreen={toggleFullscreen}
            onToggleDisplayMode={() =>
              clock.updateSettings({
                clockDisplayMode:
                  clock.settings.clockDisplayMode === 'standard' ? 'minimal' : 'standard',
              })
            }
            onTogglePlayPause={clock.togglePlayPause}
            onNextLevel={clock.goToNextLevel}
            onPrevLevel={clock.goToPrevLevel}
            onJumpToLevel={clock.jumpToLevel}
            onResetCurrentLevel={clock.resetCurrentLevel}
            onResetTournament={clock.resetTournament}
            onAdjustTime={clock.adjustTimeSeconds}
            onScrubProgress={clock.scrubProgress}
            onToggleMute={() =>
              clock.updateSettings({ soundEnabled: !clock.settings.soundEnabled })
            }
            onUpdateTableStats={clock.updateTableStats}
          />
        )}

        {activeTab === 'structure' && (
          <StructureView
            tournamentTitle={clock.tournamentTitle}
            presets={clock.presets}
            activePreset={clock.activePreset}
            currentLevelIndex={clock.currentLevelIndex}
            anteMode={clock.settings.anteMode}
            moneyConfig={clock.moneyConfig}
            chips={clock.chips}
            startingStack={clock.tableStats.startingStack}
            themeColor={clock.settings.themeColor}
            onSelectPreset={clock.selectPreset}
            onToggleFavorite={clock.toggleFavoritePreset}
            onApplyQuickSetup={clock.applyQuickSetup}
            onChangeAnteMode={(mode) => clock.updateSettings({ anteMode: mode })}
            onUpdateLevel={clock.updateLevelInActivePreset}
            onAddLevel={clock.addLevelToActivePreset}
            onRemoveLevel={clock.removeLevelFromActivePreset}
            onMoveLevel={clock.moveLevelInActivePreset}
            onApplyGlobalDuration={clock.applyGlobalDuration}
            onCreateCustomPreset={clock.createCustomPreset}
            onDeleteCustomPreset={clock.deleteCustomPreset}
            onUpdateMoneyConfig={clock.updateMoneyConfig}
            onUpdateChip={clock.updateChip}
            onAddChip={clock.addChip}
            onRemoveChip={clock.removeChip}
            onUpdateStartingStack={(stack) =>
              clock.updateTableStats({ startingStack: stack })
            }
            onStartPlaying={() => setActiveTab('clock')}
          />
        )}

        {activeTab === 'league' && (
          <LeagueView
            activePlayers={clock.activePlayers}
            playerDatabase={clock.playerDatabase}
            completedGames={clock.completedGames}
            leagues={clock.leagues}
            activeLeagueId={clock.activeLeagueId}
            activeLeague={clock.activeLeague}
            playerLifetimeStats={clock.playerLifetimeStats}
            leagueStandings={clock.leagueStandings}
            moneyConfig={clock.moneyConfig}
            prizePool={clock.prizePool}
            themeColor={clock.settings.themeColor}
            onAddPlayerToActiveGame={clock.addPlayerToActiveGame}
            onRemovePlayerFromActiveGame={clock.removePlayerFromActiveGame}
            onUpdateActivePlayer={clock.updateActivePlayer}
            onEliminatePlayer={clock.eliminateRosterPlayer}
            onReinstatePlayer={clock.reinstateRosterPlayer}
            onAssignRandomSeats={clock.assignRandomSeats}
            onFinishAndSaveGame={(orderedIds) => clock.finishAndSaveGame(orderedIds)}
            onDeleteCompletedGame={clock.deleteCompletedGame}
            onSelectLeague={clock.setActiveLeagueId}
            onCreateLeague={clock.createLeague}
            onUpdateLeagueConfig={clock.updateLeagueConfig}
          />
        )}

        {activeTab === 'tools' && (
          <SidePotCalculatorView themeColor={clock.settings.themeColor} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={clock.settings}
            tableStats={clock.tableStats}
            isOnline={isOnline}
            onUpdateSettings={clock.updateSettings}
            onUpdateTableStats={clock.updateTableStats}
            onTestSound={clock.testSound}
            onResetStructures={clock.resetAllStructures}
            onExportBackup={clock.exportBackupJson}
            onImportBackup={clock.importBackupJson}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar (5 tabs, 64px height) */}
      {!isFullscreen && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1117]/95 backdrop-blur-md border-t border-white/[0.08] pb-safe"
          aria-label="Navegación móvil"
        >
          <div className="grid grid-cols-5 items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className="min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
                  style={{ color: active ? palette.primaryHex : '#94A3B8' }}
                >
                  <Icon className="w-[20px] h-[20px]" />
                  <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                    {item.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
