import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cloneDefaultPresets,
  createNextBlindSuggestion,
  DEFAULT_CHIPS,
  DEFAULT_LEAGUE,
  DEFAULT_MONEY_CONFIG,
  DEFAULT_SETTINGS,
  DEFAULT_TABLE_STATS,
  generateQuickSetupLevels,
  QuickSetupInput,
} from '../data/presets';
import {
  ActivePlayerEntry,
  BlindLevel,
  ChipDefinition,
  CompletedGame,
  GameResultRecord,
  LeagueSeason,
  PersistedPokerState,
  PlayerProfile,
  PokerSettings,
  SoundEvent,
  StructurePreset,
  TableStats,
  TournamentMoneyConfig,
  UndoEntry,
} from '../types/poker';
import { playSoundEvent, triggerVibration, unlockAudio } from '../utils/soundEngine';

const STORAGE_KEY = 'mesapoker_state_v2';
const LEGACY_STORAGE_KEY = 'mesapoker_state_v1';

function loadInitialState(): PersistedPokerState {
  const fallbackPresets = cloneDefaultPresets();
  const fallback: PersistedPokerState = {
    tournamentTitle: 'Póker entre Amigos',
    presets: fallbackPresets,
    activePresetId: fallbackPresets[0].id,
    currentLevelIndex: 0,
    secondsRemaining: fallbackPresets[0].levels[0].durationMinutes * 60,
    totalElapsedSeconds: 0,
    settings: { ...DEFAULT_SETTINGS },
    tableStats: { ...DEFAULT_TABLE_STATS },
    moneyConfig: { ...DEFAULT_MONEY_CONFIG },
    chips: DEFAULT_CHIPS.map((c) => ({ ...c })),
    playerDatabase: [],
    activePlayers: [],
    completedGames: [],
    leagues: [{ ...DEFAULT_LEAGUE }],
    activeLeagueId: DEFAULT_LEAGUE.id,
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedPokerState> & {
      settings?: Partial<PokerSettings> & { anteEnabled?: boolean };
    };
    const presets =
      Array.isArray(parsed.presets) && parsed.presets.length > 0 ? parsed.presets : fallbackPresets;
    const activePreset =
      presets.find((p) => p.id === parsed.activePresetId) || presets[0];
    const safeIdx = Math.min(
      Math.max(0, parsed.currentLevelIndex ?? 0),
      Math.max(0, activePreset.levels.length - 1)
    );
    const activeLevel = activePreset.levels[safeIdx];
    const safeSeconds =
      typeof parsed.secondsRemaining === 'number' && parsed.secondsRemaining >= 0
        ? parsed.secondsRemaining
        : (activeLevel?.durationMinutes ?? 20) * 60;

    // Migrate v1 anteEnabled boolean -> anteMode
    const migratedSettings: PokerSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {}),
    };
    if (
      parsed.settings &&
      parsed.settings.anteEnabled !== undefined &&
      !parsed.settings.anteMode
    ) {
      migratedSettings.anteMode = parsed.settings.anteEnabled ? 'per_player' : 'none';
    }

    // Always enforce virtual currency 'fichas'
    const rawMoney = { ...DEFAULT_MONEY_CONFIG, ...(parsed.moneyConfig || {}) };
    rawMoney.currency = 'fichas';

    return {
      tournamentTitle: parsed.tournamentTitle || fallback.tournamentTitle,
      presets,
      activePresetId: activePreset.id,
      currentLevelIndex: safeIdx,
      secondsRemaining: safeSeconds,
      totalElapsedSeconds:
        typeof parsed.totalElapsedSeconds === 'number' ? parsed.totalElapsedSeconds : 0,
      settings: migratedSettings,
      tableStats: { ...DEFAULT_TABLE_STATS, ...(parsed.tableStats || {}) },
      moneyConfig: rawMoney,
      chips:
        Array.isArray(parsed.chips) && parsed.chips.length > 0
          ? parsed.chips
          : fallback.chips,
      playerDatabase: Array.isArray(parsed.playerDatabase) ? parsed.playerDatabase : [],
      activePlayers: Array.isArray(parsed.activePlayers) ? parsed.activePlayers : [],
      completedGames: Array.isArray(parsed.completedGames) ? parsed.completedGames : [],
      leagues:
        Array.isArray(parsed.leagues) && parsed.leagues.length > 0
          ? parsed.leagues
          : fallback.leagues,
      activeLeagueId:
        parsed.activeLeagueId !== undefined ? parsed.activeLeagueId : fallback.activeLeagueId,
    };
  } catch {
    return fallback;
  }
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatChipValue(value: number): string {
  return value.toLocaleString('es-ES');
}

export function formatFichas(value: number): string {
  return `${value.toLocaleString('es-ES')} fichas`;
}

export interface PlayerLifetimeStat {
  playerId: string;
  name: string;
  gamesPlayed: number;
  wins: number;
  itmCount: number;
  totalWinnings: number;
  totalCost: number;
  netBalance: number;
  roi: number;
  knockouts: number;
}

export interface LeagueStandingRow {
  playerId: string;
  name: string;
  points: number;
  games: number;
  wins: number;
  knockouts: number;
  bestFinish: number;
}

export function usePokerClock() {
  const initial = useMemo(() => loadInitialState(), []);

  const [tournamentTitle, setTournamentTitle] = useState<string>(initial.tournamentTitle);
  const [presets, setPresets] = useState<StructurePreset[]>(initial.presets);
  const [activePresetId, setActivePresetId] = useState<string>(initial.activePresetId);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(initial.currentLevelIndex);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initial.secondsRemaining);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(
    initial.totalElapsedSeconds
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [settings, setSettings] = useState<PokerSettings>(initial.settings);
  const [tableStats, setTableStats] = useState<TableStats>(initial.tableStats);
  const [moneyConfig, setMoneyConfig] = useState<TournamentMoneyConfig>(initial.moneyConfig);
  const [chips, setChips] = useState<ChipDefinition[]>(initial.chips);
  const [playerDatabase, setPlayerDatabase] = useState<PlayerProfile[]>(initial.playerDatabase);
  const [activePlayers, setActivePlayers] = useState<ActivePlayerEntry[]>(initial.activePlayers);
  const [completedGames, setCompletedGames] = useState<CompletedGame[]>(initial.completedGames);
  const [leagues, setLeagues] = useState<LeagueSeason[]>(initial.leagues);
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(initial.activeLeagueId);

  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [lastAlertBanner, setLastAlertBanner] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Shot clock ("Call the Clock!") state
  const [shotClockActive, setShotClockActive] = useState<boolean>(false);
  const [shotClockRemaining, setShotClockRemaining] = useState<number>(
    initial.settings.shotClockSeconds
  );
  const lastShotClockTickRef = useRef<number | null>(null);

  const lastTickAtRef = useRef<number | null>(null);
  const warningFiredForLevelRef = useRef<string | null>(null);
  const lastCountdownSecondRef = useRef<number | null>(null);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === activePresetId) || presets[0],
    [presets, activePresetId]
  );

  const levels = activePreset.levels;
  const safeLevelIndex = Math.min(currentLevelIndex, Math.max(0, levels.length - 1));
  const currentLevel: BlindLevel = levels[safeLevelIndex] || {
    id: 'fallback',
    type: 'level',
    smallBlind: 25,
    bigBlind: 50,
    ante: 0,
    durationMinutes: 20,
  };

  const previousLevel: BlindLevel | null = useMemo(() => {
    for (let i = safeLevelIndex - 1; i >= 0; i--) {
      if (levels[i].type === 'level') return levels[i];
    }
    return null;
  }, [levels, safeLevelIndex]);

  const nextLevel: BlindLevel | null =
    safeLevelIndex + 1 < levels.length ? levels[safeLevelIndex + 1] : null;

  const playLevelNumber = useMemo(() => {
    let count = 0;
    for (let i = 0; i <= safeLevelIndex; i++) {
      if (levels[i]?.type === 'level') count++;
    }
    return count;
  }, [levels, safeLevelIndex]);

  // Countdown to next break
  const secondsToNextBreak = useMemo(() => {
    if (currentLevel.type === 'break') return null;
    let nextBreakIdx = -1;
    for (let i = safeLevelIndex + 1; i < levels.length; i++) {
      if (levels[i].type === 'break') {
        nextBreakIdx = i;
        break;
      }
    }
    if (nextBreakIdx === -1) return null;
    let total = secondsRemaining;
    for (let i = safeLevelIndex + 1; i < nextBreakIdx; i++) {
      total += levels[i].durationMinutes * 60;
    }
    return total;
  }, [currentLevel.type, levels, safeLevelIndex, secondsRemaining]);

  // Countdown to end of rebuy period
  const secondsToRebuyEnd = useMemo(() => {
    if (moneyConfig.rebuyMaxLevel <= 0) return null;
    let targetIdx = -1;
    let seenPlayLevels = 0;
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].type === 'level') {
        seenPlayLevels++;
        if (seenPlayLevels === moneyConfig.rebuyMaxLevel) {
          targetIdx = i;
          break;
        }
      }
    }
    if (targetIdx === -1) return null;
    if (safeLevelIndex > targetIdx) return 0; // Closed
    if (safeLevelIndex === targetIdx) return secondsRemaining;
    let total = secondsRemaining;
    for (let i = safeLevelIndex + 1; i <= targetIdx; i++) {
      total += levels[i].durationMinutes * 60;
    }
    return total;
  }, [moneyConfig.rebuyMaxLevel, levels, safeLevelIndex, secondsRemaining]);

  // Persist to localStorage automatically
  useEffect(() => {
    try {
      const payload: PersistedPokerState = {
        tournamentTitle,
        presets,
        activePresetId,
        currentLevelIndex: safeLevelIndex,
        secondsRemaining,
        totalElapsedSeconds,
        settings,
        tableStats,
        moneyConfig,
        chips,
        playerDatabase,
        activePlayers,
        completedGames,
        leagues,
        activeLeagueId,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setStorageError(null);
    } catch {
      setStorageError('No se pudo guardar localmente. Verifica el espacio del navegador.');
    }
  }, [
    tournamentTitle,
    presets,
    activePresetId,
    safeLevelIndex,
    secondsRemaining,
    totalElapsedSeconds,
    settings,
    tableStats,
    moneyConfig,
    chips,
    playerDatabase,
    activePlayers,
    completedGames,
    leagues,
    activeLeagueId,
  ]);

  const dispatchSound = useCallback(
    (event: SoundEvent) => {
      playSoundEvent(event, {
        enabled: settings.soundEnabled,
        volume: settings.volume,
        profile: settings.soundProfile,
      });
    },
    [settings.soundEnabled, settings.volume, settings.soundProfile]
  );

  const sendBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (!settings.notificationsEnabled || typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body, icon: '/pwa-192x192.png', silent: true });
        } catch {
          // Ignore
        }
      }
    },
    [settings.notificationsEnabled]
  );

  const showTemporaryBanner = useCallback((message: string) => {
    setLastAlertBanner(message);
  }, []);

  useEffect(() => {
    if (!lastAlertBanner) return;
    const timer = window.setTimeout(() => setLastAlertBanner(null), 4500);
    return () => window.clearTimeout(timer);
  }, [lastAlertBanner]);

  // Shot clock countdown loop
  useEffect(() => {
    if (!shotClockActive) return;
    const timer = window.setInterval(() => {
      setShotClockRemaining((prev) => {
        const next = prev - 1;
        if (next <= 5 && next >= 1 && lastShotClockTickRef.current !== next) {
          lastShotClockTickRef.current = next;
          dispatchSound('shot_clock_tick');
        }
        if (next <= 0) {
          dispatchSound('shot_clock_end');
          triggerVibration([250, 100, 250], settings.vibrationEnabled);
          setShotClockActive(false);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [shotClockActive, dispatchSound, settings.vibrationEnabled]);

  const startShotClock = useCallback(() => {
    unlockAudio();
    lastShotClockTickRef.current = null;
    setShotClockRemaining(settings.shotClockSeconds);
    setShotClockActive(true);
    dispatchSound('ui_click');
  }, [settings.shotClockSeconds, dispatchSound]);

  const stopShotClock = useCallback(() => {
    setShotClockActive(false);
    setShotClockRemaining(settings.shotClockSeconds);
  }, [settings.shotClockSeconds]);

  const advanceToLevel = useCallback(
    (nextIndex: number, autoPlay: boolean) => {
      if (nextIndex < 0 || nextIndex >= levels.length) {
        setIsRunning(false);
        return;
      }
      const prevLvl = levels[safeLevelIndex];
      const targetLvl = levels[nextIndex];
      setCurrentLevelIndex(nextIndex);
      setSecondsRemaining(targetLvl.durationMinutes * 60);
      warningFiredForLevelRef.current = null;
      lastCountdownSecondRef.current = null;
      lastTickAtRef.current = autoPlay ? Date.now() : null;

      if (targetLvl.type === 'break') {
        dispatchSound('break_start');
        triggerVibration([250, 120, 250], settings.vibrationEnabled);
        showTemporaryBanner(`Descanso iniciado · ${targetLvl.durationMinutes} min`);
        sendBrowserNotification('Descanso en MesaPoker', `Pausa de ${targetLvl.durationMinutes} minutos.`);
      } else if (prevLvl?.type === 'break' && nextIndex > safeLevelIndex) {
        dispatchSound('break_end');
        triggerVibration([200, 100, 200, 100, 300], settings.vibrationEnabled);
        showTemporaryBanner(
          `Fin del descanso · Ciegas ${formatChipValue(targetLvl.smallBlind)}/${formatChipValue(targetLvl.bigBlind)}`
        );
        sendBrowserNotification(
          '¡Vuelven las cartas!',
          `Ciegas: ${targetLvl.smallBlind}/${targetLvl.bigBlind}`
        );
      } else {
        dispatchSound('blinds_up');
        triggerVibration([300, 120, 300], settings.vibrationEnabled);
        showTemporaryBanner(
          `Suben las ciegas · ${formatChipValue(targetLvl.smallBlind)}/${formatChipValue(targetLvl.bigBlind)}`
        );
        sendBrowserNotification(
          '¡Suben las ciegas!',
          `Nuevas ciegas: ${targetLvl.smallBlind}/${targetLvl.bigBlind}${
            settings.anteMode !== 'none' && targetLvl.ante > 0 ? ` (Ante ${targetLvl.ante})` : ''
          }`
        );
      }
    },
    [
      levels,
      safeLevelIndex,
      dispatchSound,
      settings.vibrationEnabled,
      settings.anteMode,
      showTemporaryBanner,
      sendBrowserNotification,
    ]
  );

  // Main high-precision countdown loop
  useEffect(() => {
    if (!isRunning) {
      lastTickAtRef.current = null;
      return;
    }

    if (!lastTickAtRef.current) {
      lastTickAtRef.current = Date.now();
    }

    const interval = window.setInterval(() => {
      const now = Date.now();
      const prev = lastTickAtRef.current ?? now;
      const elapsedWholeSeconds = Math.floor((now - prev) / 1000);

      if (elapsedWholeSeconds < 1) return;
      lastTickAtRef.current = prev + elapsedWholeSeconds * 1000;

      setTotalElapsedSeconds((t) => t + elapsedWholeSeconds);

      setSecondsRemaining((prevSec) => {
        const nextSec = prevSec - elapsedWholeSeconds;
        const levelKey = `${safeLevelIndex}-${currentLevel.id}`;

        if (
          settings.warning1MinEnabled &&
          currentLevel.durationMinutes >= 2 &&
          prevSec > 60 &&
          nextSec <= 60 &&
          nextSec > 0 &&
          warningFiredForLevelRef.current !== levelKey
        ) {
          warningFiredForLevelRef.current = levelKey;
          dispatchSound('warning_1m');
          triggerVibration([140, 80, 140], settings.vibrationEnabled);
          showTemporaryBanner('Último minuto del nivel actual');
        }

        if (
          settings.countdown10SecEnabled &&
          nextSec <= 10 &&
          nextSec >= 1 &&
          lastCountdownSecondRef.current !== nextSec
        ) {
          lastCountdownSecondRef.current = nextSec;
          if (nextSec <= 3) {
            dispatchSound('countdown_final');
          } else {
            dispatchSound('countdown_tick');
          }
        }

        if (nextSec <= 0) {
          if (safeLevelIndex + 1 < levels.length) {
            window.setTimeout(() => advanceToLevel(safeLevelIndex + 1, true), 0);
          } else {
            dispatchSound('blinds_up');
            triggerVibration([400, 150, 400], settings.vibrationEnabled);
            setIsRunning(false);
            showTemporaryBanner('Estructura de ciegas completada');
          }
          return 0;
        }

        return nextSec;
      });
    }, 200);

    return () => window.clearInterval(interval);
  }, [
    isRunning,
    safeLevelIndex,
    currentLevel.id,
    currentLevel.durationMinutes,
    levels.length,
    settings.warning1MinEnabled,
    settings.countdown10SecEnabled,
    settings.vibrationEnabled,
    dispatchSound,
    advanceToLevel,
    showTemporaryBanner,
  ]);

  // Playback Controls
  const togglePlayPause = useCallback(() => {
    unlockAudio();
    setIsRunning((prev) => {
      const next = !prev;
      if (next) {
        lastTickAtRef.current = Date.now();
        if (
          safeLevelIndex === 0 &&
          secondsRemaining === currentLevel.durationMinutes * 60
        ) {
          dispatchSound('level_start');
        } else {
          dispatchSound('ui_click');
        }
      } else {
        dispatchSound('ui_click');
      }
      return next;
    });
  }, [safeLevelIndex, secondsRemaining, currentLevel.durationMinutes, dispatchSound]);

  const goToNextLevel = useCallback(() => {
    unlockAudio();
    if (safeLevelIndex + 1 < levels.length) {
      advanceToLevel(safeLevelIndex + 1, isRunning);
    }
  }, [safeLevelIndex, levels.length, advanceToLevel, isRunning]);

  const goToPrevLevel = useCallback(() => {
    unlockAudio();
    if (safeLevelIndex > 0) {
      advanceToLevel(safeLevelIndex - 1, isRunning);
    } else {
      setSecondsRemaining(currentLevel.durationMinutes * 60);
      warningFiredForLevelRef.current = null;
      lastCountdownSecondRef.current = null;
      dispatchSound('ui_click');
    }
  }, [safeLevelIndex, advanceToLevel, isRunning, currentLevel.durationMinutes, dispatchSound]);

  const jumpToLevel = useCallback(
    (index: number) => {
      unlockAudio();
      if (index >= 0 && index < levels.length) {
        const target = levels[index];
        setCurrentLevelIndex(index);
        setSecondsRemaining(target.durationMinutes * 60);
        warningFiredForLevelRef.current = null;
        lastCountdownSecondRef.current = null;
        lastTickAtRef.current = isRunning ? Date.now() : null;
        dispatchSound(target.type === 'break' ? 'break_start' : 'level_start');
      }
    },
    [levels, isRunning, dispatchSound]
  );

  const resetCurrentLevel = useCallback(() => {
    unlockAudio();
    setSecondsRemaining(currentLevel.durationMinutes * 60);
    warningFiredForLevelRef.current = null;
    lastCountdownSecondRef.current = null;
    lastTickAtRef.current = isRunning ? Date.now() : null;
    dispatchSound('ui_click');
  }, [currentLevel.durationMinutes, isRunning, dispatchSound]);

  const resetTournament = useCallback(() => {
    unlockAudio();
    setIsRunning(false);
    setCurrentLevelIndex(0);
    setSecondsRemaining((levels[0]?.durationMinutes ?? 20) * 60);
    setTotalElapsedSeconds(0);
    warningFiredForLevelRef.current = null;
    lastCountdownSecondRef.current = null;
    dispatchSound('ui_click');
    showTemporaryBanner('Partida reiniciada al Nivel 1');
  }, [levels, dispatchSound, showTemporaryBanner]);

  const adjustTimeSeconds = useCallback(
    (delta: number) => {
      unlockAudio();
      setSecondsRemaining((prev) => Math.max(1, prev + delta));
      dispatchSound('ui_click');
    },
    [dispatchSound]
  );

  const scrubProgress = useCallback(
    (ratio: number) => {
      const total = currentLevel.durationMinutes * 60;
      const clamped = Math.max(0, Math.min(1, ratio));
      setSecondsRemaining(Math.round(total * (1 - clamped)));
    },
    [currentLevel.durationMinutes]
  );

  // Undo Helper for Quick Table Controls
  const pushUndo = useCallback(
    (label: string) => {
      setUndoStack((prev) => [
        ...prev.slice(-14),
        {
          tableStats: { ...tableStats },
          activePlayers: activePlayers.map((p) => ({ ...p })),
          label,
        },
      ]);
    },
    [tableStats, activePlayers]
  );

  const undoLastTableAction = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setTableStats(last.tableStats);
      setActivePlayers(last.activePlayers);
      showTemporaryBanner(`Deshecho: ${last.label}`);
      return prev.slice(0, -1);
    });
  }, [showTemporaryBanner]);

  const quickAddPlayer = useCallback(() => {
    pushUndo('+1 Jugador');
    setTableStats((prev) => ({
      ...prev,
      playersRemaining: prev.playersRemaining + 1,
      totalEntries: prev.totalEntries + 1,
    }));
  }, [pushUndo]);

  const quickEliminatePlayer = useCallback(() => {
    if (tableStats.playersRemaining <= 1) return;
    pushUndo('Jugador eliminado');
    setTableStats((prev) => ({
      ...prev,
      playersRemaining: Math.max(1, prev.playersRemaining - 1),
      totalKnockouts: prev.totalKnockouts + 1,
    }));
  }, [pushUndo, tableStats.playersRemaining]);

  const quickAddRebuy = useCallback(() => {
    pushUndo('+1 Rebuy');
    setTableStats((prev) => ({
      ...prev,
      totalRebuys: prev.totalRebuys + 1,
    }));
  }, [pushUndo]);

  const quickAddAddOn = useCallback(() => {
    pushUndo('+1 Add-on');
    setTableStats((prev) => ({
      ...prev,
      totalAddOns: prev.totalAddOns + 1,
    }));
  }, [pushUndo]);

  // Sync TableStats when editing activePlayers roster
  const syncStatsFromRoster = useCallback((roster: ActivePlayerEntry[]) => {
    if (roster.length === 0) {
      setTableStats((prev) => ({
        ...prev,
        playersRemaining: 1,
        totalEntries: 1,
        totalRebuys: 0,
        totalAddOns: 0,
        totalKnockouts: 0,
      }));
      return;
    }
    const alive = roster.filter((p) => p.eliminatedOrder === null).length;
    const rebuys = roster.reduce((s, p) => s + p.rebuys, 0);
    const addOns = roster.filter((p) => p.addOn).length;
    const kos = roster.reduce((s, p) => s + p.knockouts, 0);
    setTableStats((prev) => ({
      ...prev,
      playersRemaining: Math.max(1, alive),
      totalEntries: roster.length,
      totalRebuys: rebuys,
      totalAddOns: addOns,
      totalKnockouts: kos,
    }));
  }, []);

  // Named Player Roster & Seating & League
  const addPlayerToDatabase = useCallback((rawName: string): PlayerProfile => {
    const clean = rawName.trim();
    const existing = playerDatabase.find(
      (p) => p.name.toLowerCase() === clean.toLowerCase()
    );
    if (existing) return existing;
    const profile: PlayerProfile = {
      id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: clean,
    };
    setPlayerDatabase((prev) => [...prev, profile]);
    return profile;
  }, [playerDatabase]);

  const addPlayerToActiveGame = useCallback(
    (nameOrId: string, isExistingId = false) => {
      let profile: PlayerProfile | undefined;
      if (isExistingId) {
        profile = playerDatabase.find((p) => p.id === nameOrId);
      } else if (nameOrId.trim()) {
        profile = addPlayerToDatabase(nameOrId);
      }
      if (!profile) return;
      if (activePlayers.some((ap) => ap.playerId === profile!.id)) {
        showTemporaryBanner(`${profile.name} ya está en la mesa`);
        return;
      }
      pushUndo(`Añadir a ${profile.name}`);
      const nextRoster: ActivePlayerEntry[] = [
        ...activePlayers,
        {
          id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          playerId: profile.id,
          name: profile.name,
          rebuys: 0,
          addOn: false,
          knockouts: 0,
          eliminatedOrder: null,
          seatNumber: null,
          tableNumber: null,
        },
      ];
      setActivePlayers(nextRoster);
      syncStatsFromRoster(nextRoster);
    },
    [playerDatabase, activePlayers, addPlayerToDatabase, pushUndo, syncStatsFromRoster, showTemporaryBanner]
  );

  const removePlayerFromActiveGame = useCallback(
    (entryId: string) => {
      pushUndo('Quitar jugador');
      const nextRoster = activePlayers.filter((p) => p.id !== entryId);
      setActivePlayers(nextRoster);
      syncStatsFromRoster(nextRoster);
    },
    [activePlayers, pushUndo, syncStatsFromRoster]
  );

  const updateActivePlayer = useCallback(
    (entryId: string, patch: Partial<ActivePlayerEntry>) => {
      pushUndo('Actualizar jugador');
      const nextRoster = activePlayers.map((p) => {
        if (p.id !== entryId) return p;
        return { ...p, ...patch };
      });
      setActivePlayers(nextRoster);
      syncStatsFromRoster(nextRoster);
    },
    [activePlayers, pushUndo, syncStatsFromRoster]
  );

  const eliminateRosterPlayer = useCallback(
    (entryId: string) => {
      pushUndo('Eliminar jugador de la mano');
      const maxOrder = activePlayers.reduce(
        (m, p) => (p.eliminatedOrder && p.eliminatedOrder > m ? p.eliminatedOrder : m),
        0
      );
      const nextRoster = activePlayers.map((p) =>
        p.id === entryId ? { ...p, eliminatedOrder: maxOrder + 1 } : p
      );
      setActivePlayers(nextRoster);
      syncStatsFromRoster(nextRoster);
    },
    [activePlayers, pushUndo, syncStatsFromRoster]
  );

  const reinstateRosterPlayer = useCallback(
    (entryId: string) => {
      pushUndo('Reincorporar jugador');
      const nextRoster = activePlayers.map((p) =>
        p.id === entryId ? { ...p, eliminatedOrder: null } : p
      );
      setActivePlayers(nextRoster);
      syncStatsFromRoster(nextRoster);
    },
    [activePlayers, pushUndo, syncStatsFromRoster]
  );

  const assignRandomSeats = useCallback(() => {
    const alive = activePlayers.filter((p) => p.eliminatedOrder === null);
    if (alive.length === 0) return;
    const shuffled = [...alive];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const maxPerTable = 9;
    const tableCount = Math.max(1, Math.ceil(shuffled.length / maxPerTable));
    const seatMap = new Map<string, { table: number; seat: number }>();
    shuffled.forEach((p, idx) => {
      const table = (idx % tableCount) + 1;
      const seat = Math.floor(idx / tableCount) + 1;
      seatMap.set(p.id, { table, seat });
    });

    setActivePlayers((prev) =>
      prev.map((p) => {
        const assigned = seatMap.get(p.id);
        return assigned
          ? { ...p, tableNumber: assigned.table, seatNumber: assigned.seat }
          : { ...p, tableNumber: null, seatNumber: null };
      })
    );
    showTemporaryBanner(`Asientos sorteados en ${tableCount} ${tableCount === 1 ? 'mesa' : 'mesas'}`);
  }, [activePlayers, showTemporaryBanner]);

  // Preset & Structure Editing
  const selectPreset = useCallback(
    (presetId: string) => {
      const target = presets.find((p) => p.id === presetId);
      if (!target) return;
      setIsRunning(false);
      setActivePresetId(target.id);
      setCurrentLevelIndex(0);
      setSecondsRemaining((target.levels[0]?.durationMinutes ?? 20) * 60);
      setTotalElapsedSeconds(0);
      warningFiredForLevelRef.current = null;
      lastCountdownSecondRef.current = null;
      showTemporaryBanner(`Estructura "${target.name}" cargada`);
    },
    [presets, showTemporaryBanner]
  );

  const toggleFavoritePreset = useCallback((presetId: string) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  }, []);

  const applyQuickSetup = useCallback(
    (input: QuickSetupInput, customTitle?: string) => {
      const generated = generateQuickSetupLevels(input);
      const newId = `qs-${Date.now()}`;
      const labelMap = {
        normal: 'Normal',
        turbo: 'Turbo',
        deep: 'Deep Stack',
        cash: 'Cash Game',
        micro: 'Micro Stakes',
      };
      const newPreset: StructurePreset = {
        id: newId,
        name: `Rápido · ${labelMap[input.gameType]}`,
        description: `${input.playerCountRange} jug. · Niveles ${input.levelMinutes}m · Stack ${formatChipValue(input.startingStack)}`,
        isBuiltIn: false,
        isFavorite: true,
        levels: generated,
      };
      setPresets((prev) => [newPreset, ...prev]);
      setActivePresetId(newId);
      setCurrentLevelIndex(0);
      setSecondsRemaining((generated[0]?.durationMinutes ?? input.levelMinutes) * 60);
      setTotalElapsedSeconds(0);
      setIsRunning(false);
      setSettings((prev) => ({ ...prev, anteMode: input.anteMode }));
      setTableStats((prev) => ({ ...prev, startingStack: input.startingStack }));
      if (customTitle && customTitle.trim()) {
        setTournamentTitle(customTitle.trim());
      }
      showTemporaryBanner('Torneo configurado con Quick Setup');
    },
    [showTemporaryBanner]
  );

  const updateLevelInActivePreset = useCallback(
    (levelId: string, patch: Partial<BlindLevel>) => {
      setPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== activePresetId) return preset;
          const updatedLevels = preset.levels.map((lvl) =>
            lvl.id === levelId ? { ...lvl, ...patch } : lvl
          );
          return { ...preset, levels: updatedLevels };
        })
      );

      if (patch.durationMinutes !== undefined && levelId === currentLevel.id && !isRunning) {
        setSecondsRemaining(Math.max(1, patch.durationMinutes) * 60);
      }
    },
    [activePresetId, currentLevel.id, isRunning]
  );

  const addLevelToActivePreset = useCallback(
    (type: 'level' | 'break') => {
      setPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== activePresetId) return preset;
          const newItem: BlindLevel =
            type === 'break'
              ? {
                  id: `brk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  type: 'break',
                  smallBlind: 0,
                  bigBlind: 0,
                  ante: 0,
                  durationMinutes: 10,
                  label: 'Descanso',
                }
              : createNextBlindSuggestion(preset.levels);
          return {
            ...preset,
            levels: [...preset.levels, newItem],
          };
        })
      );
    },
    [activePresetId]
  );

  const removeLevelFromActivePreset = useCallback(
    (levelId: string) => {
      setPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== activePresetId) return preset;
          if (preset.levels.length <= 1) return preset;
          const filtered = preset.levels.filter((l) => l.id !== levelId);
          return { ...preset, levels: filtered };
        })
      );
      setCurrentLevelIndex((idx) => Math.max(0, Math.min(idx, levels.length - 2)));
    },
    [activePresetId, levels.length]
  );

  const moveLevelInActivePreset = useCallback(
    (index: number, direction: -1 | 1) => {
      setPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== activePresetId) return preset;
          const targetIdx = index + direction;
          if (targetIdx < 0 || targetIdx >= preset.levels.length) return preset;
          const copy = [...preset.levels];
          const [item] = copy.splice(index, 1);
          copy.splice(targetIdx, 0, item);
          return { ...preset, levels: copy };
        })
      );
    },
    [activePresetId]
  );

  const applyGlobalDuration = useCallback(
    (minutes: number) => {
      const safeMinutes = Math.max(1, Math.min(180, minutes));
      setPresets((prev) =>
        prev.map((preset) => {
          if (preset.id !== activePresetId) return preset;
          return {
            ...preset,
            levels: preset.levels.map((lvl) =>
              lvl.type === 'level' ? { ...lvl, durationMinutes: safeMinutes } : lvl
            ),
          };
        })
      );
      if (currentLevel.type === 'level' && !isRunning) {
        setSecondsRemaining(safeMinutes * 60);
      }
      showTemporaryBanner(`Todos los niveles ajustados a ${safeMinutes} min`);
    },
    [activePresetId, currentLevel.type, isRunning, showTemporaryBanner]
  );

  const createCustomPreset = useCallback(
    (name: string) => {
      const cleanName = name.trim() || 'Mi Torneo';
      const newPreset: StructurePreset = {
        id: `custom-${Date.now()}`,
        name: cleanName,
        description: 'Estructura personalizada',
        isBuiltIn: false,
        isFavorite: false,
        levels: activePreset.levels.map((l, i) => ({
          ...l,
          id: `c-${Date.now()}-${i}`,
        })),
      };
      setPresets((prev) => [...prev, newPreset]);
      setActivePresetId(newPreset.id);
      showTemporaryBanner(`Nueva estructura "${cleanName}" creada`);
    },
    [activePreset.levels, showTemporaryBanner]
  );

  const deleteCustomPreset = useCallback(
    (presetId: string) => {
      setPresets((prev) => {
        const target = prev.find((p) => p.id === presetId);
        if (!target || target.isBuiltIn || prev.length <= 1) return prev;
        const nextList = prev.filter((p) => p.id !== presetId);
        if (activePresetId === presetId) {
          setActivePresetId(nextList[0].id);
          setCurrentLevelIndex(0);
          setSecondsRemaining(nextList[0].levels[0].durationMinutes * 60);
          setIsRunning(false);
        }
        return nextList;
      });
    },
    [activePresetId]
  );

  const resetAllStructures = useCallback(() => {
    const fresh = cloneDefaultPresets();
    setPresets(fresh);
    setActivePresetId(fresh[0].id);
    setCurrentLevelIndex(0);
    setSecondsRemaining(fresh[0].levels[0].durationMinutes * 60);
    setTotalElapsedSeconds(0);
    setIsRunning(false);
    showTemporaryBanner('Estructuras restablecidas a valores originales');
  }, [showTemporaryBanner]);

  const updateSettings = useCallback((patch: Partial<PokerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateTableStats = useCallback((patch: Partial<TableStats>) => {
    setTableStats((prev) => {
      const next = { ...prev, ...patch };
      if (next.playersRemaining > next.totalEntries) {
        next.totalEntries = next.playersRemaining;
      }
      if (next.playersRemaining < 1) next.playersRemaining = 1;
      if (next.totalEntries < 1) next.totalEntries = 1;
      if (next.totalRebuys < 0) next.totalRebuys = 0;
      if (next.totalAddOns < 0) next.totalAddOns = 0;
      if (next.totalKnockouts < 0) next.totalKnockouts = 0;
      if (next.startingStack < 100) next.startingStack = 100;
      return next;
    });
  }, []);

  const updateMoneyConfig = useCallback((patch: Partial<TournamentMoneyConfig>) => {
    setMoneyConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateChip = useCallback((chipId: string, patch: Partial<ChipDefinition>) => {
    setChips((prev) => prev.map((c) => (c.id === chipId ? { ...c, ...patch } : c)));
  }, []);

  const addChip = useCallback(() => {
    setChips((prev) => {
      const maxVal = prev.reduce((m, c) => Math.max(m, c.value), 0);
      return [
        ...prev,
        {
          id: `c-${Date.now()}`,
          value: maxVal > 0 ? maxVal * 2 : 100,
          color: '#7C3AED',
          accentColor: '#DDD6FE',
          name: 'Nueva',
        },
      ];
    });
  }, []);

  const removeChip = useCallback((chipId: string) => {
    setChips((prev) => (prev.length <= 1 ? prev : prev.filter((c) => c.id !== chipId)));
  }, []);

  // Prize Pool & Payout Calculations
  const prizePool = useMemo(() => {
    const gross =
      tableStats.totalEntries * moneyConfig.buyIn +
      tableStats.totalRebuys * moneyConfig.rebuyCost +
      tableStats.totalAddOns * moneyConfig.addOnCost;
    return Math.max(0, gross - moneyConfig.tableFee);
  }, [tableStats, moneyConfig]);

  const payoutBreakdown = useMemo(() => {
    return moneyConfig.payoutPercentages.map((pct, idx) => ({
      place: idx + 1,
      percentage: pct,
      amount: Math.round((prizePool * pct) / 100),
    }));
  }, [moneyConfig.payoutPercentages, prizePool]);

  const activeLeague = useMemo(
    () => leagues.find((l) => l.id === activeLeagueId) || null,
    [leagues, activeLeagueId]
  );

  // Finish & Save Game to History & League
  const finishAndSaveGame = useCallback(
    (winnerFirstOrderedPlayerIds?: string[]) => {
      if (activePlayers.length === 0) return;

      const rosterRebuys = activePlayers.reduce((s, p) => s + p.rebuys, 0);
      const rosterAddOns = activePlayers.filter((p) => p.addOn).length;
      const actualPrizePool = Math.max(
        0,
        activePlayers.length * moneyConfig.buyIn +
          rosterRebuys * moneyConfig.rebuyCost +
          rosterAddOns * moneyConfig.addOnCost -
          moneyConfig.tableFee
      );

      const orderedIds =
        winnerFirstOrderedPlayerIds && winnerFirstOrderedPlayerIds.length > 0
          ? winnerFirstOrderedPlayerIds
          : [...activePlayers]
              .sort((a, b) => {
                if (a.eliminatedOrder === null && b.eliminatedOrder === null) return 0;
                if (a.eliminatedOrder === null) return -1;
                if (b.eliminatedOrder === null) return 1;
                return b.eliminatedOrder - a.eliminatedOrder;
              })
              .map((p) => p.id);

      const results: GameResultRecord[] = orderedIds.map((entryId, index) => {
        const p = activePlayers.find((ap) => ap.id === entryId)!;
        const position = index + 1;
        const pctObj = moneyConfig.payoutPercentages[position - 1];
        const prize = pctObj ? Math.round((actualPrizePool * pctObj) / 100) : 0;
        const cost =
          moneyConfig.buyIn +
          p.rebuys * moneyConfig.rebuyCost +
          (p.addOn ? moneyConfig.addOnCost : 0);
        const posPts = activeLeague
          ? activeLeague.pointsByPosition[index] ?? 1
          : 0;
        const koPts = activeLeague ? p.knockouts * activeLeague.pointsPerKO : 0;

        return {
          playerId: p.playerId,
          name: p.name,
          position,
          prize,
          cost,
          knockouts: p.knockouts,
          points: posPts + koPts,
        };
      });

      const gameRecord: CompletedGame = {
        id: `game-${Date.now()}`,
        dateIso: new Date().toISOString(),
        title: tournamentTitle,
        presetName: activePreset.name,
        leagueId: activeLeagueId,
        buyIn: moneyConfig.buyIn,
        prizePool: actualPrizePool,
        entries: activePlayers.length,
        rebuys: rosterRebuys,
        addOns: rosterAddOns,
        results,
      };

      setCompletedGames((prev) => [gameRecord, ...prev]);
      setActivePlayers((prev) =>
        prev.map((p) => ({
          ...p,
          rebuys: 0,
          addOn: false,
          knockouts: 0,
          eliminatedOrder: null,
        }))
      );
      setIsRunning(false);
      showTemporaryBanner('Partida guardada en el Historial y Liga');
    },
    [
      activePlayers,
      moneyConfig,
      activeLeague,
      tournamentTitle,
      activePreset.name,
      activeLeagueId,
      showTemporaryBanner,
    ]
  );

  const deleteCompletedGame = useCallback((gameId: string) => {
    setCompletedGames((prev) => prev.filter((g) => g.id !== gameId));
  }, []);

  const createLeague = useCallback((name: string, seasonLabel: string, pointsPerKO: number) => {
    const newLeague: LeagueSeason = {
      id: `league-${Date.now()}`,
      name: name.trim() || 'Nueva Liga',
      seasonLabel: seasonLabel.trim() || 'Temporada 1',
      pointsByPosition: [50, 35, 25, 18, 12, 8, 5, 3],
      pointsPerKO,
    };
    setLeagues((prev) => [...prev, newLeague]);
    setActiveLeagueId(newLeague.id);
  }, []);

  const updateLeagueConfig = useCallback(
    (leagueId: string, patch: Partial<LeagueSeason>) => {
      setLeagues((prev) =>
        prev.map((l) => (l.id === leagueId ? { ...l, ...patch } : l))
      );
    },
    []
  );

  // Aggregate Player Lifetime Stats
  const playerLifetimeStats: PlayerLifetimeStat[] = useMemo(() => {
    const map = new Map<string, PlayerLifetimeStat>();

    completedGames.forEach((game) => {
      game.results.forEach((r) => {
        const existing = map.get(r.playerId) || {
          playerId: r.playerId,
          name: r.name,
          gamesPlayed: 0,
          wins: 0,
          itmCount: 0,
          totalWinnings: 0,
          totalCost: 0,
          netBalance: 0,
          roi: 0,
          knockouts: 0,
        };
        existing.gamesPlayed += 1;
        if (r.position === 1) existing.wins += 1;
        if (r.prize > 0) existing.itmCount += 1;
        existing.totalWinnings += r.prize;
        existing.totalCost += r.cost;
        existing.netBalance = existing.totalWinnings - existing.totalCost;
        existing.roi =
          existing.totalCost > 0
            ? Math.round((existing.netBalance / existing.totalCost) * 100) / 100
            : 0;
        existing.knockouts += r.knockouts;
        map.set(r.playerId, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.netBalance - a.netBalance);
  }, [completedGames]);

  // Aggregate League Standings for activeLeagueId
  const leagueStandings: LeagueStandingRow[] = useMemo(() => {
    if (!activeLeagueId) return [];
    const map = new Map<string, LeagueStandingRow>();

    completedGames
      .filter((g) => g.leagueId === activeLeagueId)
      .forEach((game) => {
        game.results.forEach((r) => {
          const existing = map.get(r.playerId) || {
            playerId: r.playerId,
            name: r.name,
            points: 0,
            games: 0,
            wins: 0,
            knockouts: 0,
            bestFinish: 999,
          };
          existing.points += r.points;
          existing.games += 1;
          if (r.position === 1) existing.wins += 1;
          existing.knockouts += r.knockouts;
          existing.bestFinish = Math.min(existing.bestFinish, r.position);
          map.set(r.playerId, existing);
        });
      });

    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }, [completedGames, activeLeagueId]);

  const testSound = useCallback(
    (event: SoundEvent) => {
      unlockAudio();
      playSoundEvent(event, {
        enabled: true,
        volume: settings.volume,
        profile: settings.soundProfile,
      });
    },
    [settings.volume, settings.soundProfile]
  );

  // Export & Import JSON Backup (100% offline portability)
  const exportBackupJson = useCallback(() => {
    const payload: PersistedPokerState = {
      tournamentTitle,
      presets,
      activePresetId,
      currentLevelIndex: safeLevelIndex,
      secondsRemaining,
      totalElapsedSeconds,
      settings,
      tableStats,
      moneyConfig,
      chips,
      playerDatabase,
      activePlayers,
      completedGames,
      leagues,
      activeLeagueId,
    };
    return JSON.stringify(payload, null, 2);
  }, [
    tournamentTitle,
    presets,
    activePresetId,
    safeLevelIndex,
    secondsRemaining,
    totalElapsedSeconds,
    settings,
    tableStats,
    moneyConfig,
    chips,
    playerDatabase,
    activePlayers,
    completedGames,
    leagues,
    activeLeagueId,
  ]);

  const importBackupJson = useCallback(
    (jsonText: string): boolean => {
      try {
        const parsed = JSON.parse(jsonText) as Partial<PersistedPokerState>;
        if (!parsed || !Array.isArray(parsed.presets) || parsed.presets.length === 0) {
          return false;
        }
        setTournamentTitle(parsed.tournamentTitle || 'Póker entre Amigos');
        setPresets(parsed.presets);
        setActivePresetId(parsed.activePresetId || parsed.presets[0].id);
        setCurrentLevelIndex(parsed.currentLevelIndex || 0);
        setSecondsRemaining(
          parsed.secondsRemaining ?? parsed.presets[0].levels[0].durationMinutes * 60
        );
        if (parsed.settings) setSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
        if (parsed.tableStats) setTableStats({ ...DEFAULT_TABLE_STATS, ...parsed.tableStats });
        if (parsed.moneyConfig) {
          setMoneyConfig({
            ...DEFAULT_MONEY_CONFIG,
            ...parsed.moneyConfig,
            currency: 'fichas',
          });
        }
        if (Array.isArray(parsed.chips)) setChips(parsed.chips);
        if (Array.isArray(parsed.playerDatabase)) setPlayerDatabase(parsed.playerDatabase);
        if (Array.isArray(parsed.activePlayers)) setActivePlayers(parsed.activePlayers);
        if (Array.isArray(parsed.completedGames)) setCompletedGames(parsed.completedGames);
        if (Array.isArray(parsed.leagues) && parsed.leagues.length > 0) {
          setLeagues(parsed.leagues);
        }
        if (parsed.activeLeagueId !== undefined) setActiveLeagueId(parsed.activeLeagueId);
        setIsRunning(false);
        showTemporaryBanner('Copia de seguridad restaurada');
        return true;
      } catch {
        return false;
      }
    },
    [showTemporaryBanner]
  );

  const levelDurationSeconds = Math.max(1, currentLevel.durationMinutes * 60);
  const progressRatio = Math.max(
    0,
    Math.min(1, 1 - secondsRemaining / levelDurationSeconds)
  );
  const isOneMinuteWarning =
    settings.warning1MinEnabled &&
    currentLevel.durationMinutes >= 2 &&
    secondsRemaining <= 60 &&
    secondsRemaining > 0;

  const totalChipsInPlay =
    tableStats.totalEntries * tableStats.startingStack +
    tableStats.totalRebuys * moneyConfig.rebuyStack +
    tableStats.totalAddOns * moneyConfig.addOnStack;

  const averageStack = Math.round(
    totalChipsInPlay / Math.max(1, tableStats.playersRemaining)
  );
  const averageBigBlinds =
    currentLevel.type === 'level' && currentLevel.bigBlind > 0
      ? Math.round((averageStack / currentLevel.bigBlind) * 10) / 10
      : null;

  return {
    tournamentTitle,
    setTournamentTitle,
    presets,
    activePreset,
    levels,
    currentLevelIndex: safeLevelIndex,
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
    storageError,
    // Shot clock
    shotClockActive,
    shotClockRemaining,
    startShotClock,
    stopShotClock,
    // Undo & quick table controls
    undoCount: undoStack.length,
    undoLastTableAction,
    quickAddPlayer,
    quickEliminatePlayer,
    quickAddRebuy,
    quickAddAddOn,
    // Roster & Leagues
    playerDatabase,
    activePlayers,
    completedGames,
    leagues,
    activeLeagueId,
    activeLeague,
    playerLifetimeStats,
    leagueStandings,
    addPlayerToDatabase,
    addPlayerToActiveGame,
    removePlayerFromActiveGame,
    updateActivePlayer,
    eliminateRosterPlayer,
    reinstateRosterPlayer,
    assignRandomSeats,
    finishAndSaveGame,
    deleteCompletedGame,
    createLeague,
    setActiveLeagueId,
    updateLeagueConfig,
    // Playback & Structure Actions
    togglePlayPause,
    goToNextLevel,
    goToPrevLevel,
    jumpToLevel,
    resetCurrentLevel,
    resetTournament,
    adjustTimeSeconds,
    scrubProgress,
    selectPreset,
    toggleFavoritePreset,
    applyQuickSetup,
    updateLevelInActivePreset,
    addLevelToActivePreset,
    removeLevelFromActivePreset,
    moveLevelInActivePreset,
    applyGlobalDuration,
    createCustomPreset,
    deleteCustomPreset,
    resetAllStructures,
    updateSettings,
    updateTableStats,
    updateMoneyConfig,
    updateChip,
    addChip,
    removeChip,
    testSound,
    exportBackupJson,
    importBackupJson,
  };
}
