import React from 'react';
import {
  Compass,
  GraduationCap,
  Keyboard,
  MousePointerClick,
  X,
} from 'lucide-react';
import { useTooltipContext } from './Tooltip';

interface HelpMenuModalProps {
  isOpen: boolean;
  accentHex: string;
  tooltipsEnabled: boolean;
  onClose: () => void;
  onStartTutorial: () => void;
  onToggleTooltipsEnabled: (val: boolean) => void;
}

export const HelpMenuModal: React.FC<HelpMenuModalProps> = ({
  isOpen,
  accentHex,
  tooltipsEnabled,
  onClose,
  onStartTutorial,
  onToggleTooltipsEnabled,
}) => {
  const { exploreMode, setExploreMode } = useTooltipContext();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#12151C] border border-white/10 p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-5 max-h-[82dvh] sm:max-h-[calc(100dvh-24px)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" style={{ color: accentHex }} />
            <h2 id="help-modal-title" className="text-base sm:text-lg font-bold text-white">
              Guía, Tutorial y Tooltips
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            aria-label="Cerrar ayuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Guided Step-by-Step Tutorial */}
        <div className="rounded-xl bg-[#181C26] border border-white/[0.08] p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Tutorial interactivo paso a paso
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 sm:mt-1 leading-snug sm:leading-relaxed">
              Recorre las 5 secciones de MesaPoker en 14 pasos guiados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartTutorial();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white cursor-pointer"
            style={{ backgroundColor: accentHex }}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Iniciar tutorial guiado</span>
          </button>
        </div>

        {/* 2. Explore Mode for Touch / Quick Inspection */}
        <div className="rounded-xl bg-[#181C26] border border-white/[0.08] p-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Compass className="w-4 h-4 text-amber-300" />
              <span>Modo Explorar Tooltips</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ideal en móvil o tablet: al activarlo, toca cualquier botón, pestaña o contador para leer qué hace sin ejecutar la acción.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setExploreMode(!exploreMode);
              onClose();
            }}
            className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
              exploreMode
                ? 'bg-amber-500 text-slate-950'
                : 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
            }`}
          >
            {exploreMode ? 'Desactivar' : 'Activar'}
          </button>
        </div>

        {/* 3. Hover / Long-press Tooltips Toggle */}
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-start gap-2.5">
            <MousePointerClick className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-white">
                Tooltips automáticos
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Muestra ayuda flotante al pasar el ratón o mantener pulsado un botón en móvil
              </div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={tooltipsEnabled}
            onClick={() => onToggleTooltipsEnabled(!tooltipsEnabled)}
            className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors"
            style={{ backgroundColor: tooltipsEnabled ? accentHex : '#1E2330' }}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                tooltipsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 4. Keyboard Shortcuts Reference (Desktop only) */}
        <div className="hidden md:block pt-3 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Keyboard className="w-4 h-4 text-slate-400" />
            <span>Atajos rápidos en ordenador</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div className="flex items-center justify-between rounded-lg bg-[#0A0C10] px-3 py-2">
              <span>Iniciar / Pausar</span>
              <kbd className="font-mono-tabular text-white">Espacio</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0A0C10] px-3 py-2">
              <span>Cambiar nivel</span>
              <kbd className="font-mono-tabular text-white">← / →</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0A0C10] px-3 py-2">
              <span>Modo TV</span>
              <kbd className="font-mono-tabular text-white">F</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#0A0C10] px-3 py-2">
              <span>Cerrar ventana</span>
              <kbd className="font-mono-tabular text-white">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
