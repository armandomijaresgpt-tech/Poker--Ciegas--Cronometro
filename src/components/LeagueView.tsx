import React, { useState } from 'react';
import {
  Users,
  Trophy,
  History,
  BarChart3,
  UserPlus,
  Shuffle,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Skull,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ActivePlayerEntry,
  CompletedGame,
  LeagueSeason,
  PlayerProfile,
  ThemeColorId,
  TournamentMoneyConfig,
} from '../types/poker';
import {
  LeagueStandingRow,
  PlayerLifetimeStat,
  formatChipValue,
  formatFichas,
} from '../hooks/usePokerClock';
import { THEME_PALETTES } from '../data/presets';
import { NumericInput } from './NumericInput';
import { Tooltip } from './Tooltip';

interface LeagueViewProps {
  activePlayers: ActivePlayerEntry[];
  playerDatabase: PlayerProfile[];
  completedGames: CompletedGame[];
  leagues: LeagueSeason[];
  activeLeagueId: string | null;
  activeLeague: LeagueSeason | null;
  playerLifetimeStats: PlayerLifetimeStat[];
  leagueStandings: LeagueStandingRow[];
  moneyConfig: TournamentMoneyConfig;
  prizePool: number;
  themeColor: ThemeColorId;
  onAddPlayerToActiveGame: (nameOrId: string, isExistingId?: boolean) => void;
  onRemovePlayerFromActiveGame: (entryId: string) => void;
  onUpdateActivePlayer: (entryId: string, patch: Partial<ActivePlayerEntry>) => void;
  onEliminatePlayer: (entryId: string) => void;
  onReinstatePlayer: (entryId: string) => void;
  onAssignRandomSeats: () => void;
  onFinishAndSaveGame: (winnerFirstOrderedPlayerIds?: string[]) => void;
  onDeleteCompletedGame: (gameId: string) => void;
  onSelectLeague: (leagueId: string | null) => void;
  onCreateLeague: (name: string, seasonLabel: string, pointsPerKO: number) => void;
  onUpdateLeagueConfig: (leagueId: string, patch: Partial<LeagueSeason>) => void;
}

type LeagueSubTab = 'roster' | 'history' | 'stats' | 'league';

export const LeagueView: React.FC<LeagueViewProps> = ({
  activePlayers,
  playerDatabase,
  completedGames,
  leagues,
  activeLeagueId,
  activeLeague,
  playerLifetimeStats,
  leagueStandings,
  moneyConfig,
  prizePool,
  themeColor,
  onAddPlayerToActiveGame,
  onRemovePlayerFromActiveGame,
  onUpdateActivePlayer,
  onEliminatePlayer,
  onReinstatePlayer,
  onAssignRandomSeats,
  onFinishAndSaveGame,
  onDeleteCompletedGame,
  onSelectLeague,
  onCreateLeague,
  onUpdateLeagueConfig,
}) => {
  const [subTab, setSubTab] = useState<LeagueSubTab>('roster');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [showNewLeagueForm, setShowNewLeagueForm] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newSeasonLabel, setNewSeasonLabel] = useState('Temporada 1');
  const [newPointsKO, setNewPointsKO] = useState(2);

  const palette = THEME_PALETTES[themeColor];
  const alivePlayers = activePlayers.filter((p) => p.eliminatedOrder === null);
  const aliveCount = alivePlayers.length;

  const rosterRebuys = activePlayers.reduce((s, p) => s + p.rebuys, 0);
  const rosterAddOns = activePlayers.filter((p) => p.addOn).length;
  const rosterPrizePool =
    activePlayers.length > 0
      ? Math.max(
          0,
          activePlayers.length * moneyConfig.buyIn +
            rosterRebuys * moneyConfig.rebuyCost +
            rosterAddOns * moneyConfig.addOnCost -
            moneyConfig.tableFee
        )
      : prizePool;

  const openConfirmFinish = () => {
    const defaultWinner = alivePlayers[0]?.id || activePlayers[0]?.id || '';
    setSelectedWinnerId(defaultWinner);
    setConfirmFinish(true);
  };

  const handleConfirmFinish = () => {
    const orderedIds = [...activePlayers]
      .sort((a, b) => {
        if (a.id === selectedWinnerId) return -1;
        if (b.id === selectedWinnerId) return 1;
        if (a.eliminatedOrder === null && b.eliminatedOrder === null) return 0;
        if (a.eliminatedOrder === null) return -1;
        if (b.eliminatedOrder === null) return 1;
        return b.eliminatedOrder - a.eliminatedOrder;
      })
      .map((p) => p.id);
    onFinishAndSaveGame(orderedIds);
    setConfirmFinish(false);
  };

  const availableSavedPlayers = playerDatabase.filter(
    (db) => !activePlayers.some((ap) => ap.playerId === db.id)
  );

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddPlayerToActiveGame(newPlayerName.trim(), false);
    setNewPlayerName('');
  };

  const handleCreateLeague = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName.trim()) return;
    onCreateLeague(newLeagueName.trim(), newSeasonLabel.trim() || 'Temporada 1', newPointsKO);
    setNewLeagueName('');
    setShowNewLeagueForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header + Sub-navigation */}
      <section
        data-tour="league-section"
        className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Jugadores, Historial y Liga
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Controla entradas individuales, sortea asientos, registra resultados y lleva tu liga por temporadas offline.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              {
                id: 'roster',
                label: 'Mesa y Asientos',
                tooltip: 'Añade jugadores a la partida actual, sortea asientos y registra rebuys, add-ons o eliminaciones.',
                icon: Users,
              },
              {
                id: 'history',
                label: `Historial (${completedGames.length})`,
                tooltip: 'Consulta los resultados, posiciones, knockouts y botes en fichas de torneos anteriores.',
                icon: History,
              },
              {
                id: 'stats',
                label: 'Estadísticas y ROI',
                tooltip: 'Tabla acumulada de victorias, entradas en premios (ITM), balance neto en fichas y ROI por jugador.',
                icon: BarChart3,
              },
              {
                id: 'league',
                label: 'Liga y Temporada',
                tooltip: 'Crea temporadas de liga y configura los puntos por posición final y por cada knockout.',
                icon: Trophy,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <Tooltip key={tab.id} title={tab.label} content={tab.tooltip}>
                <button
                  type="button"
                  onClick={() => setSubTab(tab.id)}
                  className={`min-h-[42px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-white font-semibold'
                      : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                  style={active ? { backgroundColor: palette.primaryHex } : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              </Tooltip>
            );
          })}
        </div>
      </section>

      {/* SUB-TAB 1: ACTIVE ROSTER & SEATING */}
      {subTab === 'roster' && (
        <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <form onSubmit={handleAddPlayer} className="flex items-center gap-2 flex-1 max-w-md">
              <Tooltip
                title="Nombre del jugador"
                content="Escribe el nombre de un nuevo participante para registrarlo en la mesa y guardarlo en tu base local."
                className="flex-1"
              >
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="Nombre del jugador..."
                  className="min-h-[44px] w-full rounded-xl bg-[#0A0C10] border border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-white/40"
                />
              </Tooltip>
              <Tooltip title="Añadir jugador" content="Sienta al jugador en la partida actual y actualiza automáticamente el conteo de entradas.">
                <button
                  type="submit"
                  className="min-h-[44px] flex items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                  style={{ backgroundColor: palette.primaryHex }}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Añadir</span>
                </button>
              </Tooltip>
            </form>

            <div className="flex flex-wrap items-center gap-2.5">
              <Tooltip
                title="Sortear asientos al azar"
                content="Asigna aleatoriamente mesa y número de silla entre todos los jugadores que siguen activos."
              >
                <button
                  type="button"
                  onClick={onAssignRandomSeats}
                  disabled={aliveCount < 2}
                  className="min-h-[44px] flex items-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] disabled:opacity-40 border border-white/[0.08] px-4 text-xs sm:text-sm font-medium text-slate-200 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Sortear asientos</span>
                </button>
              </Tooltip>

              {!confirmFinish ? (
                <Tooltip
                  title="Finalizar y guardar partida"
                  content="Cierra el torneo, reparte premios en fichas y puntos de liga, y guarda el resultado en el historial."
                >
                  <button
                    type="button"
                    onClick={openConfirmFinish}
                    disabled={activePlayers.length < 2}
                    className="min-h-[44px] flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 text-xs sm:text-sm font-semibold text-white cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar y guardar partida</span>
                  </button>
                </Tooltip>
              ) : (
                <div className="flex flex-wrap items-center gap-2 bg-[#181C26] border border-emerald-500/40 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-200">
                    Bote {formatFichas(rosterPrizePool)}
                  </span>
                  {aliveCount > 1 && (
                    <Tooltip title="Elegir ganador (1.º puesto)" content="Si quedan varios jugadores vivos (pacto), selecciona quién queda 1.º.">
                      <select
                        value={selectedWinnerId}
                        onChange={(e) => setSelectedWinnerId(e.target.value)}
                        aria-label="Seleccionar ganador 1.º puesto"
                        className="min-h-[34px] rounded-lg bg-[#0A0C10] border border-white/15 px-2 text-xs text-white"
                      >
                        {alivePlayers.map((ap) => (
                          <option key={ap.id} value={ap.id}>
                            1.º {ap.name}
                          </option>
                        ))}
                      </select>
                    </Tooltip>
                  )}
                  <Tooltip title="Confirmar cierre" content="Guarda definitivamente esta partida en el historial y estadísticas.">
                    <button
                      type="button"
                      onClick={handleConfirmFinish}
                      className="min-h-[34px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                    >
                      Confirmar
                    </button>
                  </Tooltip>
                  <Tooltip title="Cancelar" content="Vuelve a la mesa sin cerrar todavía el torneo.">
                    <button
                      type="button"
                      onClick={() => setConfirmFinish(false)}
                      className="min-h-[34px] px-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          {/* Quick-add from saved player database */}
          {availableSavedPlayers.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-400">
                Jugadores habituales (toca para añadir a esta mesa):
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSavedPlayers.map((db) => (
                  <Tooltip
                    key={db.id}
                    title={`Añadir a ${db.name}`}
                    content="Incorpora con un toque a este jugador guardado a la partida actual."
                  >
                    <button
                      type="button"
                      onClick={() => onAddPlayerToActiveGame(db.id, true)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#181C26] hover:bg-white/[0.1] border border-white/[0.06] text-xs font-medium text-slate-200 cursor-pointer"
                    >
                      + {db.name}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* Active Players Table */}
          {activePlayers.length === 0 ? (
            <div className="rounded-xl bg-[#0A0C10] border border-white/[0.06] p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-200">
                Aún no hay jugadores registrados en esta partida
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Añade los nombres de tus amigos arriba para llevar sus rebuys, add-ons, knockouts, sortear asientos y guardar sus estadísticas al terminar.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
              {activePlayers.map((p) => {
                const isOut = p.eliminatedOrder !== null;
                return (
                  <div
                    key={p.id}
                    className={`py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      isOut ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {p.name}
                          </span>
                          {p.tableNumber && p.seatNumber && !isOut && (
                            <span className="text-xs font-mono-tabular text-amber-300">
                              · M{p.tableNumber} Asiento {p.seatNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {isOut ? `Eliminado (#${p.eliminatedOrder} en salir)` : 'En juego'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Rebuys */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-[#181C26] border border-white/[0.06] px-2.5 py-1">
                        <span className="text-[11px] text-slate-400 mr-1">Rebuys</span>
                        <Tooltip title="Quitar Rebuy" content={`Resta 1 recompra a ${p.name} y ajusta el bote.`}>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateActivePlayer(p.id, { rebuys: Math.max(0, p.rebuys - 1) })
                            }
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                            aria-label={`Quitar rebuy a ${p.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <span className="font-mono-tabular text-xs font-bold text-white w-5 text-center">
                          {p.rebuys}
                        </span>
                        <Tooltip title="Sumar Rebuy" content={`Registra +1 recompra para ${p.name} y suma su coste al bote.`}>
                          <button
                            type="button"
                            onClick={() => onUpdateActivePlayer(p.id, { rebuys: p.rebuys + 1 })}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                            aria-label={`Sumar rebuy a ${p.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Add-on */}
                      <Tooltip
                        title="Add-on individual"
                        content={`Activa o desactiva la recarga final (Add-on) para ${p.name}.`}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateActivePlayer(p.id, { addOn: !p.addOn })}
                          className={`min-h-[38px] px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            p.addOn
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-[#181C26] text-slate-400 border-white/[0.06] hover:text-white'
                          }`}
                        >
                          Add-on {p.addOn ? '1/1' : '0/1'}
                        </button>
                      </Tooltip>

                      {/* Knockouts */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-[#181C26] border border-white/[0.06] px-2.5 py-1">
                        <Skull className="w-3.5 h-3.5 text-slate-400" />
                        <Tooltip title="Restar KO" content={`Reduce en 1 las eliminaciones conseguidas por ${p.name}.`}>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateActivePlayer(p.id, {
                                knockouts: Math.max(0, p.knockouts - 1),
                              })
                            }
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                            aria-label={`Quitar KO a ${p.name}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <span className="font-mono-tabular text-xs font-bold text-white w-4 text-center">
                          {p.knockouts}
                        </span>
                        <Tooltip title="Sumar KO" content={`Suma +1 eliminación conseguida por ${p.name} (otorga puntos extra en liga).`}>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateActivePlayer(p.id, { knockouts: p.knockouts + 1 })
                            }
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-300 cursor-pointer"
                            aria-label={`Sumar KO a ${p.name}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>

                      {/* Eliminate / Reinstate */}
                      {isOut ? (
                        <Tooltip title="Reincorporar jugador" content={`Devuelve a ${p.name} al torneo como jugador activo.`}>
                          <button
                            type="button"
                            onClick={() => onReinstatePlayer(p.id)}
                            className="min-h-[38px] px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white cursor-pointer"
                          >
                            Reincorporar
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Eliminar jugador" content={`Marca a ${p.name} como eliminado y registra su orden de salida.`}>
                          <button
                            type="button"
                            onClick={() => onEliminatePlayer(p.id)}
                            disabled={aliveCount <= 1}
                            className="min-h-[38px] px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 disabled:opacity-30 text-xs font-medium text-rose-300 cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </Tooltip>
                      )}

                      <Tooltip title="Quitar de la partida" content={`Elimina a ${p.name} de esta mesa (seguirá guardado como jugador habitual).`}>
                        <button
                          type="button"
                          onClick={() => onRemovePlayerFromActiveGame(p.id)}
                          className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-white/[0.06] cursor-pointer"
                          aria-label={`Quitar a ${p.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 2: COMPLETED GAME HISTORY */}
      {subTab === 'history' && (
        <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-white">Historial de torneos jugados</h2>
          {completedGames.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Aún no hay partidas guardadas. Cuando finalices un torneo desde la pestaña «Mesa y Asientos» aparecerá aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {completedGames.map((game) => {
                const isExpanded = expandedGameId === game.id;
                const dateFormatted = new Date(game.dateIso).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const winner = game.results[0];

                return (
                  <div
                    key={game.id}
                    className="rounded-xl bg-[#181C26] border border-white/[0.06] overflow-hidden"
                  >
                    <div className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <Tooltip
                        title="Desplegar resultados"
                        content="Toca para ver la clasificación completa, KOs, puntos y fichas ganadas en este torneo."
                        className="flex-1 min-w-0"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                          className="w-full text-left min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <span className="truncate">{game.title}</span>
                            <span className="text-xs font-normal text-slate-400">
                              · {dateFormatted}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {game.entries} jugadores · Bote {formatFichas(game.prizePool)}
                            {winner && ` · Ganador: ${winner.name}`}
                          </div>
                        </button>
                      </Tooltip>

                      <div className="flex items-center gap-1">
                        <Tooltip title={isExpanded ? 'Contraer' : 'Ver detalles'} content="Muestra u oculta el desglose de puestos y fichas ganadas.">
                          <button
                            type="button"
                            onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white cursor-pointer"
                            aria-label="Ver detalles del torneo"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </Tooltip>
                        <Tooltip title="Borrar del historial" content="Elimina esta partida guardada del historial y recalcula las estadísticas.">
                          <button
                            type="button"
                            onClick={() => onDeleteCompletedGame(game.id)}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 cursor-pointer"
                            aria-label="Eliminar partida del historial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] divide-y divide-white/[0.05]">
                        {game.results.map((r) => (
                          <div
                            key={`${game.id}-${r.playerId}`}
                            className="py-2 flex items-center justify-between text-xs sm:text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono-tabular font-bold text-slate-400 w-6">
                                #{r.position}
                              </span>
                              <span className="font-medium text-white">{r.name}</span>
                              {r.knockouts > 0 && (
                                <span className="text-xs text-slate-400">
                                  ({r.knockouts} KO)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 font-mono-tabular">
                              {r.points > 0 && (
                                <span className="text-xs text-amber-300">+{r.points} pts</span>
                              )}
                              <span
                                className={
                                  r.prize > 0 ? 'font-semibold text-emerald-400' : 'text-slate-500'
                                }
                              >
                                {formatFichas(r.prize)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 3: PLAYER LIFETIME STATS & ROI */}
      {subTab === 'stats' && (
        <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Ranking histórico y estadísticas por jugador
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Balance neto, victorias, entradas en premios (ITM) y ROI calculados de tus partidas guardadas
            </p>
          </div>

          {playerLifetimeStats.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Sin estadísticas todavía. Guarda al menos una partida para ver la clasificación y el ROI.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400">
                    <th className="py-2.5 pr-4 font-medium">Jugador</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      <Tooltip title="Torneos jugados" content="Total de partidas finalizadas en las que ha participado.">
                        <span className="cursor-help border-b border-dotted border-slate-600">Torneos</span>
                      </Tooltip>
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      <Tooltip title="Victorias (1.º puesto)" content="Veces que ha ganado el torneo quedando primero.">
                        <span className="cursor-help border-b border-dotted border-slate-600">Victorias</span>
                      </Tooltip>
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      <Tooltip title="ITM (In The Money)" content="Veces que el jugador terminó en puestos premiados con fichas.">
                        <span className="cursor-help border-b border-dotted border-slate-600">ITM</span>
                      </Tooltip>
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      <Tooltip title="Knockouts (KOs)" content="Total de rivales eliminados acumulados en el historial.">
                        <span className="cursor-help border-b border-dotted border-slate-600">KOs</span>
                      </Tooltip>
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      <Tooltip title="Balance neto en fichas" content="Diferencia total entre fichas ganadas en premios y fichas invertidas (entradas, rebuys y add-ons).">
                        <span className="cursor-help border-b border-dotted border-slate-600">Balance</span>
                      </Tooltip>
                    </th>
                    <th className="py-2.5 pl-3 font-medium text-right">
                      <Tooltip title="ROI (Retorno de Inversión)" content="Porcentaje de rentabilidad sobre el total de fichas invertidas.">
                        <span className="cursor-help border-b border-dotted border-slate-600">ROI</span>
                      </Tooltip>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] font-mono-tabular">
                  {playerLifetimeStats.map((st) => (
                    <tr key={st.playerId} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-4 font-sans font-semibold text-white">
                        {st.name}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">{st.gamesPlayed}</td>
                      <td className="py-3 px-3 text-right text-amber-300">{st.wins}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{st.itmCount}</td>
                      <td className="py-3 px-3 text-right text-slate-300">{st.knockouts}</td>
                      <td
                        className={`py-3 px-3 text-right font-semibold ${
                          st.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {st.netBalance >= 0 ? '+' : ''}
                        {formatFichas(st.netBalance)}
                      </td>
                      <td className="py-3 pl-3 text-right text-slate-300">
                        {(st.roi * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* SUB-TAB 4: POKER LEAGUE SEASONS */}
      {subTab === 'league' && (
        <div className="space-y-5">
          <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Liga por temporadas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Suma puntos automáticos por posición final y por cada eliminación (Knockout)
                </p>
              </div>
              <Tooltip title="Nueva liga o temporada" content="Crea una nueva competición con su propia clasificación y reglas de puntos.">
                <button
                  type="button"
                  onClick={() => setShowNewLeagueForm((v) => !v)}
                  className="min-h-[40px] px-3.5 rounded-xl bg-[#181C26] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white cursor-pointer"
                >
                  + Nueva liga / temporada
                </button>
              </Tooltip>
            </div>

            {showNewLeagueForm && (
              <form
                onSubmit={handleCreateLeague}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl bg-[#0A0C10] border border-white/10 p-4"
              >
                <Tooltip title="Nombre de la liga" content="Nombre del grupo o campeonato (ej. Liga de los Viernes)." className="w-full">
                  <input
                    type="text"
                    value={newLeagueName}
                    onChange={(e) => setNewLeagueName(e.target.value)}
                    placeholder="Nombre de la liga"
                    className="min-h-[42px] w-full rounded-xl bg-[#12151C] border border-white/10 px-3 text-sm text-white"
                  />
                </Tooltip>
                <Tooltip title="Temporada" content="Etiqueta de edición o periodo (ej. Temporada 2026 o Verano)." className="w-full">
                  <input
                    type="text"
                    value={newSeasonLabel}
                    onChange={(e) => setNewSeasonLabel(e.target.value)}
                    placeholder="Temporada"
                    className="min-h-[42px] w-full rounded-xl bg-[#12151C] border border-white/10 px-3 text-sm text-white"
                  />
                </Tooltip>
                <Tooltip title="Puntos por Knockout" content="Puntos extra que gana un jugador cada vez que elimina a un oponente." className="w-full">
                  <NumericInput
                    min={0}
                    max={50}
                    value={newPointsKO}
                    onChange={setNewPointsKO}
                    placeholder="Pts por KO"
                    aria-label="Puntos por Knockout"
                    className="min-h-[42px] w-full rounded-xl bg-[#12151C] border border-white/10 px-3 text-sm font-mono-tabular text-white"
                  />
                </Tooltip>
                <Tooltip title="Crear liga" content="Guarda la nueva liga y la selecciona como liga activa." className="w-full">
                  <button
                    type="submit"
                    className="min-h-[42px] w-full rounded-xl text-sm font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: palette.primaryHex }}
                  >
                    Crear liga
                  </button>
                </Tooltip>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {leagues.map((lg) => (
                <Tooltip
                  key={lg.id}
                  title={`${lg.name} · ${lg.seasonLabel}`}
                  content="Selecciona esta liga para ver su tabla y sumar los puntos de la próxima partida que finalices."
                >
                  <button
                    type="button"
                    onClick={() => onSelectLeague(lg.id)}
                    className={`min-h-[40px] px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                      activeLeagueId === lg.id
                        ? 'bg-white text-slate-950 font-semibold'
                        : 'bg-[#181C26] text-slate-300 border border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {lg.name} · {lg.seasonLabel}
                  </button>
                </Tooltip>
              ))}
            </div>

            {activeLeague && (
              <div className="pt-4 border-t border-white/[0.08] space-y-3 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Puntos por posición final (1.º a 8.º):</span>
                  <Tooltip title="Puntos por cada KO" content="Bonificación de puntos que recibe cada jugador por cada eliminación lograda en la partida.">
                    <label className="flex items-center gap-2">
                      <span>Puntos por KO:</span>
                      <NumericInput
                        min={0}
                        max={50}
                        value={activeLeague.pointsPerKO}
                        onChange={(val) =>
                          onUpdateLeagueConfig(activeLeague.id, { pointsPerKO: val })
                        }
                        className="w-16 min-h-[34px] rounded-lg bg-[#0A0C10] border border-white/15 px-2 text-center font-mono-tabular text-white"
                      />
                    </label>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {activeLeague.pointsByPosition.map((pts, idx) => (
                    <Tooltip
                      key={idx}
                      title={`Puntos ${idx + 1}.º puesto`}
                      content={`Puntos de liga que suma quien termine en la posición ${idx + 1}.`}
                      className="w-full"
                    >
                      <div className="w-full space-y-1 text-center">
                        <span className="text-[11px] text-slate-400">{idx + 1}.º</span>
                        <NumericInput
                          min={0}
                          max={500}
                          value={pts}
                          onChange={(val) => {
                            const next = [...activeLeague.pointsByPosition];
                            next[idx] = val;
                            onUpdateLeagueConfig(activeLeague.id, { pointsByPosition: next });
                          }}
                          aria-label={`Puntos puesto ${idx + 1}`}
                          className="w-full min-h-[36px] rounded-lg bg-[#0A0C10] border border-white/15 px-1 text-center font-mono-tabular text-white"
                        />
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-white mb-4">
              Clasificación de la temporada
            </h3>

            {leagueStandings.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Aún no hay jornadas puntuadas en esta liga. Finaliza una partida con esta liga seleccionada para ver la tabla.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400">
                      <th className="py-2.5 pr-3 font-medium">Pos</th>
                      <th className="py-2.5 pr-4 font-medium">Jugador</th>
                      <th className="py-2.5 px-3 font-medium text-right">Puntos</th>
                      <th className="py-2.5 px-3 font-medium text-right">Partidas</th>
                      <th className="py-2.5 px-3 font-medium text-right">Victorias</th>
                      <th className="py-2.5 pl-3 font-medium text-right">KOs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] font-mono-tabular">
                    {leagueStandings.map((row, idx) => (
                      <tr key={row.playerId} className="hover:bg-white/[0.02]">
                        <td className="py-3 pr-3 font-bold text-slate-400">#{idx + 1}</td>
                        <td className="py-3 pr-4 font-sans font-semibold text-white">
                          {row.name}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-300">
                          {row.points}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-300">{row.games}</td>
                        <td className="py-3 px-3 text-right text-slate-300">{row.wins}</td>
                        <td className="py-3 pl-3 text-right text-slate-300">{row.knockouts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
