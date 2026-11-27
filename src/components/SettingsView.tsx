import React, { useRef, useState } from 'react';
import {
  Volume2,
  Bell,
  Smartphone,
  Sun,
  RotateCcw,
  WifiOff,
  Wifi,
  Play,
  Sliders,
  Palette,
  Download,
  Upload,
} from 'lucide-react';
import {
  PokerSettings,
  SoundEvent,
  SoundProfile,
  TableStats,
  ThemeColorId,
} from '../types/poker';
import { THEME_PALETTES } from '../data/presets';
import { PWAInstallButton } from './PWAInstallButton';
import { NumericInput } from './NumericInput';

interface SettingsViewProps {
  settings: PokerSettings;
  tableStats: TableStats;
  isOnline: boolean;
  onUpdateSettings: (patch: Partial<PokerSettings>) => void;
  onUpdateTableStats: (patch: Partial<TableStats>) => void;
  onTestSound: (event: SoundEvent) => void;
  onResetStructures: () => void;
  onExportBackup: () => string;
  onImportBackup: (json: string) => boolean;
}

const SOUND_TESTS: { event: SoundEvent; label: string; detail: string }[] = [
  { event: 'level_start', label: 'Inicio de ronda', detail: 'Campana armónica suave' },
  { event: 'blinds_up', label: 'Cambio de ciegas', detail: 'Fanfarria triple ascendente' },
  { event: 'warning_1m', label: 'Preaviso 1 min', detail: 'Doble toque de madera' },
  { event: 'countdown_tick', label: 'Cuenta regresiva', detail: 'Pulso de últimos 10s' },
  { event: 'break_start', label: 'Inicio de descanso', detail: 'Acorde descendente relajado' },
  { event: 'break_end', label: 'Fin de descanso', detail: 'Doble aviso de regreso' },
  { event: 'shot_clock_end', label: 'Fin Call the Clock', detail: 'Alarma de tiempo agotado' },
];

const SOUND_PROFILES: { id: SoundProfile; label: string }[] = [
  { id: 'casino', label: 'Casino' },
  { id: 'modern', label: 'Moderno' },
  { id: 'classic', label: 'Clásico' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  tableStats,
  isOnline,
  onUpdateSettings,
  onUpdateTableStats,
  onTestSound,
  onResetStructures,
  onExportBackup,
  onImportBackup,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const palette = THEME_PALETTES[settings.themeColor];

  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      onUpdateSettings({ notificationsEnabled: false });
      return;
    }
    if (typeof Notification === 'undefined') {
      onUpdateSettings({ notificationsEnabled: false });
      return;
    }
    if (Notification.permission === 'granted') {
      onUpdateSettings({ notificationsEnabled: true });
      return;
    }
    try {
      const result = await Notification.requestPermission();
      onUpdateSettings({ notificationsEnabled: result === 'granted' });
    } catch {
      onUpdateSettings({ notificationsEnabled: false });
    }
  };

  const handleDownloadBackup = () => {
    const json = onExportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesapoker-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMessage('Copia de seguridad descargada.');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = onImportBackup(text);
      setBackupMessage(
        ok
          ? 'Datos restaurados correctamente.'
          : 'Archivo no válido. Usa un respaldo JSON de MesaPoker.'
      );
    } catch {
      setBackupMessage('No se pudo leer el archivo seleccionado.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Configuración, tema y avisos
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Personaliza los colores de la mesa, los timbres de cada evento y la copia de seguridad offline.
        </p>
      </div>

      {/* Section 0: Color Theme & Display */}
      <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2.5 text-base font-semibold text-white">
          <Palette className="w-5 h-5" style={{ color: palette.primaryHex }} />
          <h2>Apariencia y pantalla del reloj</h2>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-white">Tema de color</div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {(Object.keys(THEME_PALETTES) as ThemeColorId[]).map((colorId) => {
              const item = THEME_PALETTES[colorId];
              const active = settings.themeColor === colorId;
              return (
                <button
                  key={colorId}
                  type="button"
                  onClick={() => onUpdateSettings({ themeColor: colorId })}
                  className={`min-h-[44px] flex items-center gap-2.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'border-white bg-white/[0.08] text-white font-semibold'
                      : 'border-white/[0.08] bg-[#181C26] text-slate-300 hover:text-white'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 border border-white/30"
                    style={{ backgroundColor: item.primaryHex }}
                  />
                  <span className="text-xs sm:text-sm">{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-white/[0.06] pt-2">
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">Diseño del reloj</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Cambia entre tablero completo o pantalla dividida gigante para el centro de la mesa
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0A0C10] border border-white/[0.08] w-fit">
              <button
                type="button"
                onClick={() => onUpdateSettings({ clockDisplayMode: 'standard' })}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-medium cursor-pointer ${
                  settings.clockDisplayMode === 'standard'
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={
                  settings.clockDisplayMode === 'standard'
                    ? { backgroundColor: palette.primaryHex }
                    : undefined
                }
              >
                Estándar / TV
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ clockDisplayMode: 'minimal' })}
                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-medium cursor-pointer ${
                  settings.clockDisplayMode === 'minimal'
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={
                  settings.clockDisplayMode === 'minimal'
                    ? { backgroundColor: palette.primaryHex }
                    : undefined
                }
              >
                Mesa Minimalista
              </button>
            </div>
          </div>

          <ToggleRow
            label="Pantalla de bienvenida previa (Pre-Game Intro)"
            description="Muestra un resumen de stack, entrada (fichas) y reparto de fichas antes de empezar el Nivel 1"
            checked={settings.preGameIntroEnabled}
            onChange={(val) => onUpdateSettings({ preGameIntroEnabled: val })}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Mostrar bote y premios en el reloj"
            description="Muestra el Prize Pool y 1.º / 2.º / 3.º en vivo en el tablero principal y modo TV"
            checked={settings.showPayoutsOnClock}
            onChange={(val) => onUpdateSettings({ showPayoutsOnClock: val })}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Mostrar leyenda de fichas en el reloj"
            description="Muestra las fichas de colores y sus valores en el tablero del torneo"
            checked={settings.showChipLegend}
            onChange={(val) => onUpdateSettings({ showChipLegend: val })}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Fijar guía de manos en barra lateral"
            description="Mantiene visible el ranking de manos en la pantalla del reloj para jugadores nuevos"
            checked={settings.showHandRankings}
            onChange={(val) => onUpdateSettings({ showHandRankings: val })}
            accentHex={palette.primaryHex}
          />
        </div>
      </section>

      {/* Section 1: Sound & Alerts */}
      <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-2.5 text-base font-semibold text-white">
          <Volume2 className="w-5 h-5" style={{ color: palette.primaryHex }} />
          <h2>Sonidos diferenciados y alertas</h2>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <ToggleRow
            label="Sonido activado"
            description="Reproduce avisos sonoros sintetizados sin necesidad de internet"
            checked={settings.soundEnabled}
            onChange={(val) => onUpdateSettings({ soundEnabled: val })}
            accentHex={palette.primaryHex}
          />

          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Volumen de alertas</div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono-tabular">
                {Math.round(settings.volume * 100)}%
              </div>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              aria-label="Volumen de alertas"
              className="w-full sm:w-56 cursor-pointer h-2"
              style={{ accentColor: palette.primaryHex }}
            />
          </div>

          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Estilo de timbre</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Elige el tono que mejor destaque en tu sala
              </div>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0A0C10] border border-white/[0.08] w-fit">
              {SOUND_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => onUpdateSettings({ soundProfile: profile.id })}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    settings.soundProfile === profile.id
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  style={
                    settings.soundProfile === profile.id
                      ? { backgroundColor: palette.primaryHex }
                      : undefined
                  }
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Duración de «Call the Clock»</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Tiempo límite al pedir reloj sobre una jugada
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[15, 30, 45, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ shotClockSeconds: sec })}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-mono-tabular font-medium cursor-pointer ${
                    settings.shotClockSeconds === sec
                      ? 'text-white font-semibold'
                      : 'bg-[#181C26] text-slate-300 border border-white/[0.06]'
                  }`}
                  style={
                    settings.shotClockSeconds === sec
                      ? { backgroundColor: palette.primaryHex }
                      : undefined
                  }
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Preaviso de 1 minuto"
            description="Doble toque suave cuando falte 1 minuto para subir ciegas"
            checked={settings.warning1MinEnabled}
            onChange={(val) => onUpdateSettings({ warning1MinEnabled: val })}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Cuenta regresiva final (10s)"
            description="Pulsos cortos durante los últimos 10 segundos del nivel"
            checked={settings.countdown10SecEnabled}
            onChange={(val) => onUpdateSettings({ countdown10SecEnabled: val })}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Vibración en móvil"
            description="Vibra al cambiar de ciegas o iniciar un descanso"
            checked={settings.vibrationEnabled}
            onChange={(val) => onUpdateSettings({ vibrationEnabled: val })}
            icon={<Smartphone className="w-4 h-4 text-slate-400" />}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Notificaciones del sistema"
            description="Muestra un aviso si cambias de aplicación durante la partida"
            checked={settings.notificationsEnabled}
            onChange={handleToggleNotifications}
            icon={<Bell className="w-4 h-4 text-slate-400" />}
            accentHex={palette.primaryHex}
          />

          <ToggleRow
            label="Mantener pantalla encendida"
            description="Evita que el teléfono o tablet se bloquee mientras el reloj corre"
            checked={settings.keepScreenAwake}
            onChange={(val) => onUpdateSettings({ keepScreenAwake: val })}
            icon={<Sun className="w-4 h-4 text-slate-400" />}
            accentHex={palette.primaryHex}
          />
        </div>

        {/* Sound Tester */}
        <div className="pt-4 border-t border-white/[0.08]">
          <div className="text-sm font-semibold text-white">Probar sonidos por evento</div>
          <p className="mt-1 text-xs text-slate-400">
            Pulsa cualquiera para escuchar cómo suena cada aviso de la partida:
          </p>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SOUND_TESTS.map((item) => (
              <button
                key={item.event}
                type="button"
                onClick={() => onTestSound(item.event)}
                className="min-h-[52px] flex items-center justify-between gap-3 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.06] px-4 py-2.5 text-left transition-colors active:scale-[0.98] cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{item.detail}</div>
                </div>
                <Play className="w-4 h-4 shrink-0 fill-current" style={{ color: palette.primaryHex }} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Table Controls */}
      <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-semibold text-white">
          <Sliders className="w-5 h-5" style={{ color: palette.primaryHex }} />
          <h2>Controles de mesa</h2>
        </div>

        <ToggleRow
          label="Control de mesa en vivo (+Jugador, +Rebuy, -Jugador)"
          description="Muestra los botones rápidos de entradas, recompras, stack promedio y deshacer debajo del reloj"
          checked={settings.showTableStats}
          onChange={(val) => onUpdateSettings({ showTableStats: val })}
          accentHex={palette.primaryHex}
        />

        {settings.showTableStats && (
          <div className="pt-3 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-white">Stack inicial por jugador</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Usado para calcular el stack promedio en tiempo real
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[5000, 10000, 20000, 50000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onUpdateTableStats({ startingStack: val })}
                  className={`min-h-[38px] px-3 rounded-lg text-xs font-mono-tabular font-medium transition-colors cursor-pointer ${
                    tableStats.startingStack === val
                      ? 'bg-white text-slate-950 font-semibold'
                      : 'bg-[#181C26] text-slate-300 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {val.toLocaleString('es-ES')}
                </button>
              ))}
              <NumericInput
                min={100}
                step={500}
                value={tableStats.startingStack}
                onChange={(val) => onUpdateTableStats({ startingStack: val })}
                aria-label="Stack inicial personalizado"
                className="min-h-[38px] w-24 rounded-lg bg-[#0A0C10] border border-white/15 px-2.5 text-center text-xs font-mono-tabular text-white"
              />
            </div>
          </div>
        )}
      </section>

      {/* Section 3: Offline, Backup & Reset */}
      <section className="rounded-2xl bg-[#12151C] border border-white/[0.08] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-base font-semibold text-white">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-emerald-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-amber-400" />
            )}
            <h2>Modo offline, respaldo e instalación</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {isOnline ? 'Conectado · Caché offline lista' : 'Sin conexión · Funcionamiento local'}
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          Todos los cronómetros, sonidos, estructuras, historial y ligas funcionan al 100% en tu dispositivo sin gastar datos ni requerir señal.
        </p>

        <PWAInstallButton variant="card" />

        {/* Offline JSON Backup Export/Import */}
        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Copia de seguridad local (JSON)</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Exporta o importa tus ligas, jugadores, historial y estructuras sin internet
            </div>
            {backupMessage && (
              <div className="text-xs text-emerald-400 mt-1">{backupMessage}</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="min-h-[42px] flex items-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-4 text-xs sm:text-sm font-medium text-white cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] flex items-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-4 text-xs sm:text-sm font-medium text-white cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white">Restablecer estructuras</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Vuelve a los niveles de fábrica (Normal, Turbo, Deep Stack y Sit & Go)
            </div>
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-[#181C26] hover:bg-[#222735] border border-white/[0.08] px-4 py-2 text-sm font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer estructuras</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetStructures();
                  setConfirmReset(false);
                }}
                className="min-h-[44px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-semibold text-white cursor-pointer"
              >
                Confirmar reinicio
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[44px] px-4 rounded-xl bg-[#181C26] text-sm text-slate-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  accentHex: string;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  checked,
  onChange,
  icon,
  accentHex,
}) => {
  return (
    <div className="py-4 flex items-center justify-between gap-4">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div>
          <div className="text-sm font-medium text-white">{label}</div>
          <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</div>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors duration-200"
        style={{ backgroundColor: checked ? accentHex : '#1E2330' }}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};
