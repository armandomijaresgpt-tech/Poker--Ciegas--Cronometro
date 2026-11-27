import {
  AnteMode,
  BlindLevel,
  ChipDefinition,
  LeagueSeason,
  PokerSettings,
  StructurePreset,
  TableStats,
  ThemeColorId,
  TournamentMoneyConfig,
} from '../types/poker';

export interface ThemePalette {
  id: ThemeColorId;
  name: string;
  primaryHex: string;
  primaryHoverHex: string;
  softBgHex: string;
  borderHex: string;
  splitLeftBg: string;
}

export const THEME_PALETTES: Record<ThemeColorId, ThemePalette> = {
  crimson: {
    id: 'crimson',
    name: 'Rojo Carmesí',
    primaryHex: '#E11D48',
    primaryHoverHex: '#F43F5E',
    softBgHex: 'rgba(225, 29, 72, 0.14)',
    borderHex: 'rgba(244, 63, 94, 0.42)',
    splitLeftBg: '#9F1239',
  },
  blue: {
    id: 'blue',
    name: 'Azul Mesa',
    primaryHex: '#2563EB',
    primaryHoverHex: '#3B82F6',
    softBgHex: 'rgba(37, 99, 235, 0.16)',
    borderHex: 'rgba(59, 130, 246, 0.45)',
    splitLeftBg: '#1D4ED8',
  },
  emerald: {
    id: 'emerald',
    name: 'Verde Tapete',
    primaryHex: '#059669',
    primaryHoverHex: '#10B981',
    softBgHex: 'rgba(5, 150, 105, 0.16)',
    borderHex: 'rgba(16, 185, 129, 0.45)',
    splitLeftBg: '#065F46',
  },
  amber: {
    id: 'amber',
    name: 'Ámbar Oro',
    primaryHex: '#D97706',
    primaryHoverHex: '#F59E0B',
    softBgHex: 'rgba(217, 119, 6, 0.16)',
    borderHex: 'rgba(245, 158, 11, 0.45)',
    splitLeftBg: '#92400E',
  },
  purple: {
    id: 'purple',
    name: 'Violeta Club',
    primaryHex: '#7C3AED',
    primaryHoverHex: '#8B5CF6',
    softBgHex: 'rgba(124, 58, 237, 0.16)',
    borderHex: 'rgba(139, 92, 246, 0.45)',
    splitLeftBg: '#5B21B6',
  },
  slate: {
    id: 'slate',
    name: 'Grafito Pro',
    primaryHex: '#475569',
    primaryHoverHex: '#64748B',
    softBgHex: 'rgba(71, 85, 105, 0.2)',
    borderHex: 'rgba(148, 163, 184, 0.35)',
    splitLeftBg: '#1E293B',
  },
};

function makeLevel(
  id: string,
  smallBlind: number,
  bigBlind: number,
  ante: number,
  durationMinutes: number
): BlindLevel {
  return {
    id,
    type: 'level',
    smallBlind,
    bigBlind,
    ante,
    durationMinutes,
  };
}

function makeBreak(id: string, durationMinutes: number, label = 'Descanso'): BlindLevel {
  return {
    id,
    type: 'break',
    smallBlind: 0,
    bigBlind: 0,
    ante: 0,
    durationMinutes,
    label,
  };
}

export const DEFAULT_PRESETS: StructurePreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Niveles de 20 min con progresión equilibrada',
    isBuiltIn: true,
    isFavorite: true,
    levels: [
      makeLevel('n-1', 25, 50, 0, 20),
      makeLevel('n-2', 50, 100, 0, 20),
      makeLevel('n-3', 75, 150, 25, 20),
      makeLevel('n-4', 100, 200, 25, 20),
      makeLevel('n-5', 150, 300, 50, 20),
      makeLevel('n-6', 200, 400, 50, 20),
      makeLevel('n-7', 250, 500, 75, 20),
      makeLevel('n-8', 300, 600, 75, 20),
      makeBreak('n-b1', 10, 'Descanso'),
      makeLevel('n-9', 400, 800, 100, 20),
      makeLevel('n-10', 500, 1000, 100, 20),
      makeLevel('n-11', 600, 1200, 200, 20),
      makeLevel('n-12', 800, 1600, 200, 20),
      makeLevel('n-13', 1000, 2000, 300, 20),
      makeLevel('n-14', 1500, 3000, 400, 20),
      makeLevel('n-15', 2000, 4000, 500, 20),
      makeLevel('n-16', 3000, 6000, 1000, 20),
    ],
  },
  {
    id: 'turbo',
    name: 'Turbo',
    description: 'Niveles rápidos de 10 min para partidas ágiles',
    isBuiltIn: true,
    isFavorite: false,
    levels: [
      makeLevel('t-1', 25, 50, 0, 10),
      makeLevel('t-2', 50, 100, 0, 10),
      makeLevel('t-3', 100, 200, 25, 10),
      makeLevel('t-4', 150, 300, 50, 10),
      makeLevel('t-5', 200, 400, 50, 10),
      makeLevel('t-6', 300, 600, 75, 10),
      makeBreak('t-b1', 5, 'Descanso rápido'),
      makeLevel('t-7', 400, 800, 100, 10),
      makeLevel('t-8', 600, 1200, 200, 10),
      makeLevel('t-9', 800, 1600, 200, 10),
      makeLevel('t-10', 1000, 2000, 300, 10),
      makeLevel('t-11', 1500, 3000, 500, 10),
      makeLevel('t-12', 2500, 5000, 500, 10),
    ],
  },
  {
    id: 'deepstack',
    name: 'Deep Stack',
    description: 'Torneo largo con niveles de 30 min y dos descansos',
    isBuiltIn: true,
    isFavorite: false,
    levels: [
      makeLevel('d-1', 25, 50, 0, 30),
      makeLevel('d-2', 50, 100, 0, 30),
      makeLevel('d-3', 75, 150, 0, 30),
      makeLevel('d-4', 100, 200, 25, 30),
      makeBreak('d-b1', 10, 'Descanso 1'),
      makeLevel('d-5', 150, 300, 25, 30),
      makeLevel('d-6', 200, 400, 50, 30),
      makeLevel('d-7', 300, 600, 75, 30),
      makeLevel('d-8', 400, 800, 100, 30),
      makeBreak('d-b2', 15, 'Descanso 2'),
      makeLevel('d-9', 500, 1000, 100, 30),
      makeLevel('d-10', 600, 1200, 200, 30),
      makeLevel('d-11', 800, 1600, 200, 30),
      makeLevel('d-12', 1000, 2000, 300, 30),
      makeLevel('d-13', 1500, 3000, 400, 30),
      makeLevel('d-14', 2000, 4000, 500, 30),
      makeLevel('d-15', 3000, 6000, 1000, 30),
      makeLevel('d-16', 5000, 10000, 1000, 30),
    ],
  },
  {
    id: 'sitngo',
    name: 'Sit & Go',
    description: 'Mesa corta de 8 min por nivel',
    isBuiltIn: true,
    isFavorite: false,
    levels: [
      makeLevel('s-1', 10, 20, 0, 8),
      makeLevel('s-2', 15, 30, 0, 8),
      makeLevel('s-3', 25, 50, 0, 8),
      makeLevel('s-4', 50, 100, 10, 8),
      makeLevel('s-5', 75, 150, 20, 8),
      makeLevel('s-6', 100, 200, 25, 8),
      makeLevel('s-7', 150, 300, 40, 8),
      makeLevel('s-8', 200, 400, 50, 8),
      makeLevel('s-9', 300, 600, 75, 8),
      makeLevel('s-10', 500, 1000, 100, 8),
    ],
  },
];

export const DEFAULT_CHIPS: ChipDefinition[] = [
  { id: 'c-25', value: 25, color: '#DC2626', accentColor: '#FCA5A5', name: 'Roja' },
  { id: 'c-100', value: 100, color: '#18181B', accentColor: '#E4E4E7', name: 'Negra' },
  { id: 'c-500', value: 500, color: '#2563EB', accentColor: '#93C5FD', name: 'Azul' },
  { id: 'c-1000', value: 1000, color: '#16A34A', accentColor: '#86EFAC', name: 'Verde' },
  { id: 'c-5000', value: 5000, color: '#CA8A04', accentColor: '#FEF08A', name: 'Dorada' },
];

export const DEFAULT_MONEY_CONFIG: TournamentMoneyConfig = {
  currency: 'fichas',
  buyIn: 1000,
  rebuyCost: 1000,
  addOnCost: 1000,
  rebuyStack: 10000,
  addOnStack: 15000,
  tableFee: 0,
  rebuyMaxLevel: 6,
  payoutPercentages: [50, 30, 20],
};

export const DEFAULT_LEAGUE: LeagueSeason = {
  id: 'league-default',
  name: 'Liga de los Viernes',
  seasonLabel: 'Temporada 1',
  pointsByPosition: [50, 35, 25, 18, 12, 8, 5, 3],
  pointsPerKO: 2,
};

export const DEFAULT_SETTINGS: PokerSettings = {
  soundEnabled: true,
  volume: 0.85,
  soundProfile: 'casino',
  warning1MinEnabled: true,
  countdown10SecEnabled: true,
  anteMode: 'per_player',
  vibrationEnabled: true,
  notificationsEnabled: false,
  keepScreenAwake: true,
  showTableStats: true,
  showChipLegend: true,
  showHandRankings: false,
  showPayoutsOnClock: true,
  preGameIntroEnabled: false,
  shotClockSeconds: 30,
  themeColor: 'crimson',
  clockDisplayMode: 'standard',
  tooltipsEnabled: true,
};

export const DEFAULT_TABLE_STATS: TableStats = {
  playersRemaining: 8,
  totalEntries: 8,
  totalRebuys: 0,
  totalAddOns: 0,
  totalKnockouts: 0,
  startingStack: 10000,
};

export const HAND_RANKINGS = [
  { rank: 1, name: 'Escalera Real', example: 'A♠ K♠ Q♠ J♠ 10♠', desc: 'Diez al As del mismo palo' },
  { rank: 2, name: 'Escalera de Color', example: '9♥ 8♥ 7♥ 6♥ 5♥', desc: 'Cinco seguidas del mismo palo' },
  { rank: 3, name: 'Póker', example: 'K♠ K♥ K♦ K♣ 4♠', desc: 'Cuatro cartas del mismo valor' },
  { rank: 4, name: 'Full House', example: 'J♠ J♥ J♦ 8♣ 8♠', desc: 'Trío más pareja' },
  { rank: 5, name: 'Color', example: 'A♦ J♦ 9♦ 6♦ 2♦', desc: 'Cinco del mismo palo' },
  { rank: 6, name: 'Escalera', example: '10♣ 9♦ 8♥ 7♠ 6♣', desc: 'Cinco seguidas de distinto palo' },
  { rank: 7, name: 'Trío', example: 'Q♠ Q♥ Q♦ 9♣ 3♠', desc: 'Tres cartas iguales' },
  { rank: 8, name: 'Doble Pareja', example: 'A♣ A♦ 7♠ 7♥ K♣', desc: 'Dos pares distintos' },
  { rank: 9, name: 'Pareja', example: '10♠ 10♥ A♦ 6♣ 2♠', desc: 'Dos cartas iguales' },
  { rank: 10, name: 'Carta Alta', example: 'A♠ J♦ 9♣ 5♥ 2♣', desc: 'Gana la carta más alta' },
];

export function createNextBlindSuggestion(levels: BlindLevel[]): BlindLevel {
  const playLevels = levels.filter((l) => l.type === 'level');
  const last = playLevels[playLevels.length - 1];
  const id = `lvl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (!last) {
    return makeLevel(id, 25, 50, 0, 20);
  }

  const nextSmall = roundCleanBlind(last.smallBlind * 1.5);
  const nextBig = nextSmall * 2;
  const nextAnte =
    last.ante > 0
      ? roundCleanBlind(nextBig * 0.15)
      : last.bigBlind >= 150
        ? roundCleanBlind(nextBig * 0.12)
        : 0;

  return makeLevel(id, nextSmall, nextBig, nextAnte, last.durationMinutes);
}

export function roundCleanBlind(value: number): number {
  if (value <= 10) return Math.max(1, Math.round(value));
  if (value <= 25) return Math.ceil(value / 5) * 5;
  if (value <= 100) return Math.ceil(value / 25) * 25;
  if (value <= 500) return Math.ceil(value / 50) * 50;
  if (value <= 2000) return Math.ceil(value / 100) * 100;
  return Math.ceil(value / 500) * 500;
}

export function cloneDefaultPresets(): StructurePreset[] {
  return DEFAULT_PRESETS.map((preset) => ({
    ...preset,
    levels: preset.levels.map((lvl) => ({ ...lvl })),
  }));
}

// Quick Setup Generator (calculates balanced blinds, breaks, and starting chip counts)
export interface QuickSetupInput {
  gameType: 'normal' | 'turbo' | 'deep' | 'cash' | 'micro';
  playerCountRange: string;
  targetMinutes: number;
  levelMinutes: number;
  smallestChip: number;
  startingStack: number;
  anteMode: AnteMode;
}

export interface ChipDistributionItem {
  value: number;
  count: number;
  color: string;
}

export function calculateChipDistribution(
  startingStack: number,
  smallestChip: number,
  chips: ChipDefinition[]
): ChipDistributionItem[] {
  const activeDenoms = chips
    .map((c) => c.value)
    .filter((v) => v >= smallestChip)
    .sort((a, b) => a - b);

  const fallbackDenoms =
    activeDenoms.length > 0
      ? activeDenoms
      : [smallestChip, smallestChip * 4, smallestChip * 20, smallestChip * 100];

  const counts = new Map<number, number>();
  let remaining = startingStack;

  // Give generous playable base of lower denominations first
  const d0 = fallbackDenoms[0];
  const d1 = fallbackDenoms[1] ?? d0 * 4;
  const d2 = fallbackDenoms[2] ?? d1 * 5;
  const d3 = fallbackDenoms[3] ?? d2 * 2;

  const give = (val: number, qty: number) => {
    const actual = Math.min(qty, Math.floor(remaining / val));
    if (actual > 0) {
      counts.set(val, (counts.get(val) || 0) + actual);
      remaining -= actual * val;
    }
  };

  give(d0, 8);
  give(d1, 8);
  give(d2, 4);

  // Fill remaining top-down from largest to smallest
  const descending = [...fallbackDenoms].sort((a, b) => b - a);
  for (const denom of descending) {
    if (remaining >= denom) {
      const qty = Math.floor(remaining / denom);
      if (denom === d3 || qty <= 12 || denom === descending[0]) {
        give(denom, qty);
      }
    }
  }

  if (remaining > 0) {
    give(d0, Math.floor(remaining / d0));
  }

  return fallbackDenoms
    .filter((v) => (counts.get(v) || 0) > 0)
    .map((v) => {
      const match = chips.find((c) => c.value === v);
      return {
        value: v,
        count: counts.get(v) || 0,
        color: match?.color || '#334155',
      };
    });
}

export function generateQuickSetupLevels(input: QuickSetupInput): BlindLevel[] {
  const { gameType, targetMinutes, levelMinutes, smallestChip, startingStack, anteMode } = input;

  if (gameType === 'cash') {
    const sb = smallestChip;
    const bb = smallestChip * 2;
    return [makeLevel(`qs-cash-1`, sb, bb, 0, levelMinutes)];
  }

  const numPlayLevels = Math.max(6, Math.min(24, Math.round(targetMinutes / levelMinutes)));
  const multiplier =
    gameType === 'turbo' ? 1.58 : gameType === 'deep' ? 1.35 : 1.44;

  const levels: BlindLevel[] = [];
  let currentSB = smallestChip;
  const breakInterval = gameType === 'turbo' ? 6 : 5;

  for (let i = 1; i <= numPlayLevels; i++) {
    const sb = i === 1 ? smallestChip : roundStepToChip(currentSB, smallestChip);
    const bb = sb * 2;

    let ante = 0;
    if (anteMode === 'big_blind' && i >= 3) {
      ante = bb;
    } else if (anteMode === 'per_player' && i >= 3) {
      ante = roundStepToChip(Math.max(smallestChip, Math.round(bb * 0.125)), smallestChip);
    }

    levels.push(makeLevel(`qs-${Date.now()}-${i}`, sb, bb, ante, levelMinutes));

    if (i < numPlayLevels && i % breakInterval === 0) {
      levels.push(
        makeBreak(`qs-brk-${Date.now()}-${i}`, gameType === 'turbo' ? 5 : 10, 'Descanso')
      );
    }

    // Escalate toward ~10% of starting stack by the final levels
    const minNext = sb === currentSB ? sb * 1.5 : currentSB * multiplier;
    const targetEndBoost =
      i > numPlayLevels - 3 ? Math.max(minNext, startingStack / (numPlayLevels - i + 4)) : minNext;
    currentSB = Math.max(sb + smallestChip, targetEndBoost);
  }

  return levels;
}

function roundStepToChip(val: number, unit: number): number {
  const raw = Math.ceil(val / unit) * unit;
  if (raw <= unit * 4) return raw;
  if (raw <= unit * 20) return Math.ceil(raw / (unit * 2)) * (unit * 2);
  if (raw <= unit * 100) return Math.ceil(raw / (unit * 5)) * (unit * 5);
  return Math.ceil(raw / (unit * 20)) * (unit * 20);
}

// Side Pot Calculator
export interface SidePotInputPlayer {
  id: string;
  name: string;
  bet: number;
  folded?: boolean;
}

export interface CalculatedPot {
  name: string;
  amount: number;
  eligiblePlayers: string[];
  explanation: string;
}

export function calculateSidePots(players: SidePotInputPlayer[]): CalculatedPot[] {
  const contributors = players.filter((p) => p.bet > 0);
  if (contributors.length === 0) return [];

  const uniqueLevels = Array.from(
    new Set(contributors.filter((p) => !p.folded).map((p) => p.bet))
  ).sort((a, b) => a - b);

  // Include max bet level if only folded players bet higher (rare edge case)
  const maxBet = Math.max(...contributors.map((p) => p.bet));
  if (uniqueLevels.length === 0 || uniqueLevels[uniqueLevels.length - 1] < maxBet) {
    uniqueLevels.push(maxBet);
  }

  const pots: CalculatedPot[] = [];
  let prevCap = 0;

  uniqueLevels.forEach((cap) => {
    const slice = cap - prevCap;
    if (slice <= 0) return;

    const participants = contributors.filter((p) => p.bet > prevCap);
    let potAmount = 0;
    const details: string[] = [];

    participants.forEach((p) => {
      const contrib = Math.min(p.bet - prevCap, slice);
      potAmount += contrib;
      details.push(`${p.name}: ${contrib}`);
    });

    const eligible = participants.filter((p) => !p.folded).map((p) => p.name);
    if (potAmount > 0 && eligible.length > 0) {
      const potIndex = pots.length;
      const potTitle = potIndex === 0 ? 'Bote Principal (Main Pot)' : `Bote Paralelo ${potIndex}`;
      const explanation =
        prevCap === 0
          ? `Apuesta mínima cubierta: ${cap}. Aportan ${participants.length} jugadores (${details.join(', ')}).`
          : `Tramo de ${prevCap} a ${cap} (+${slice}). Aportan ${participants.length} jugadores (${details.join(', ')}).`;

      pots.push({
        name: potTitle,
        amount: potAmount,
        eligiblePlayers: eligible,
        explanation,
      });
    }

    prevCap = cap;
  });

  return pots;
}
