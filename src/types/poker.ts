export type LevelType = 'level' | 'break';

export type AnteMode = 'none' | 'per_player' | 'big_blind';

export type ThemeColorId = 'crimson' | 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';

export interface BlindLevel {
  id: string;
  type: LevelType;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  durationMinutes: number;
  label?: string;
}

export interface StructurePreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  isFavorite?: boolean;
  levels: BlindLevel[];
}

export interface ChipDefinition {
  id: string;
  value: number;
  color: string;
  accentColor: string;
  name: string;
}

export interface TournamentMoneyConfig {
  currency: string;
  buyIn: number;
  rebuyCost: number;
  addOnCost: number;
  rebuyStack: number;
  addOnStack: number;
  tableFee: number;
  rebuyMaxLevel: number; // 0 = no rebuys allowed, N = allowed until end of play level N
  payoutPercentages: number[]; // e.g. [50, 30, 20]
}

export interface ActivePlayerEntry {
  id: string;
  playerId: string;
  name: string;
  rebuys: number;
  addOn: boolean;
  knockouts: number;
  eliminatedOrder: number | null; // null = still in play; 1 = first eliminated, etc.
  seatNumber: number | null;
  tableNumber: number | null;
}

export interface PlayerProfile {
  id: string;
  name: string;
}

export interface GameResultRecord {
  playerId: string;
  name: string;
  position: number; // 1 = winner
  prize: number;
  cost: number;
  knockouts: number;
  points: number;
}

export interface CompletedGame {
  id: string;
  dateIso: string;
  title: string;
  presetName: string;
  leagueId: string | null;
  buyIn: number;
  prizePool: number;
  entries: number;
  rebuys: number;
  addOns: number;
  results: GameResultRecord[];
}

export interface LeagueSeason {
  id: string;
  name: string;
  seasonLabel: string;
  pointsByPosition: number[]; // index 0 = 1st place points, etc.
  pointsPerKO: number;
}

export type SoundProfile = 'casino' | 'modern' | 'classic';

export type SoundEvent =
  | 'level_start'
  | 'blinds_up'
  | 'warning_1m'
  | 'countdown_tick'
  | 'countdown_final'
  | 'break_start'
  | 'break_end'
  | 'shot_clock_tick'
  | 'shot_clock_end'
  | 'ui_click';

export type ClockDisplayMode = 'standard' | 'minimal';

export interface PokerSettings {
  soundEnabled: boolean;
  volume: number;
  soundProfile: SoundProfile;
  warning1MinEnabled: boolean;
  countdown10SecEnabled: boolean;
  anteMode: AnteMode;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  keepScreenAwake: boolean;
  showTableStats: boolean;
  showChipLegend: boolean;
  showHandRankings: boolean;
  showPayoutsOnClock: boolean;
  preGameIntroEnabled: boolean;
  shotClockSeconds: number;
  themeColor: ThemeColorId;
  clockDisplayMode: ClockDisplayMode;
}

export interface TableStats {
  playersRemaining: number;
  totalEntries: number;
  totalRebuys: number;
  totalAddOns: number;
  totalKnockouts: number;
  startingStack: number;
}

export interface UndoEntry {
  tableStats: TableStats;
  activePlayers: ActivePlayerEntry[];
  label: string;
}

export interface PersistedPokerState {
  tournamentTitle: string;
  presets: StructurePreset[];
  activePresetId: string;
  currentLevelIndex: number;
  secondsRemaining: number;
  totalElapsedSeconds: number;
  settings: PokerSettings;
  tableStats: TableStats;
  moneyConfig: TournamentMoneyConfig;
  chips: ChipDefinition[];
  playerDatabase: PlayerProfile[];
  activePlayers: ActivePlayerEntry[];
  completedGames: CompletedGame[];
  leagues: LeagueSeason[];
  activeLeagueId: string | null;
}

export type AppTab = 'clock' | 'structure' | 'league' | 'tools' | 'settings';
