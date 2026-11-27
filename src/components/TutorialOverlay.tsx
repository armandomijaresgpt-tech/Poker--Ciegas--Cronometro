import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  GraduationCap,
  Sparkles,
  X,
} from 'lucide-react';
import { AppTab } from '../types/poker';
import { TUTORIAL_STEPS } from '../data/tutorialSteps';
import { useTooltipContext } from './Tooltip';

interface TutorialOverlayProps {
  isOpen: boolean;
  accentHex: string;
  onSwitchTab: (tab: AppTab) => void;
  onClose: () => void;
}

interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  accentHex,
  onSwitchTab,
  onClose,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [cardPos, setCardPos] = useState<{ left: number; top: number } | null>(null);
  const [showTipOnMobile, setShowTipOnMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { exploreMode, setExploreMode } = useTooltipContext();

  const step = TUTORIAL_STEPS[stepIndex] || TUTORIAL_STEPS[0];

  const findVisibleTarget = useCallback((): HTMLElement | null => {
    if (!step.targetSelector) return null;
    const candidates = Array.from(
      document.querySelectorAll(step.targetSelector)
    ) as HTMLElement[];
    return (
      candidates.find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }) || null
    );
  }, [step.targetSelector]);

  const measureTarget = useCallback(() => {
    const visible = findVisibleTarget();
    if (!visible) {
      setTargetRect(null);
      return;
    }
    const r = visible.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 5;

    const left = Math.max(4, r.left - pad);
    const top = Math.max(4, r.top - pad);
    const right = Math.min(vw - 4, r.right + pad);
    const bottom = Math.min(vh - 4, r.bottom + pad);

    if (right <= left || bottom <= top) {
      setTargetRect(null);
      return;
    }

    setTargetRect({
      left,
      top,
      width: right - left,
      height: bottom - top,
      right,
      bottom,
    });
  }, [findVisibleTarget]);

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setShowTipOnMobile(false);
  }, [isOpen]);

  useEffect(() => {
    setShowTipOnMobile(false);
  }, [stepIndex]);

  useEffect(() => {
    if (!isOpen) return;
    onSwitchTab(step.tab);

    const scrollTimer = window.setTimeout(() => {
      const visible = findVisibleTarget();
      if (visible) {
        const rect = visible.getBoundingClientRect();
        const vh = window.innerHeight;
        const isMobile = window.innerWidth < 640;

        if (isMobile) {
          // On phones, keep fixed bottom nav untouched and scroll non-nav targets into the upper screen half
          const isBottomNav = rect.top > vh * 0.75 && rect.height < 110;
          if (!isBottomNav) {
            const targetTopY = Math.max(0, window.scrollY + rect.top - 64);
            window.scrollTo({ top: targetTopY, behavior: 'smooth' });
          }
        } else if (rect.height > vh * 0.55) {
          const y = window.scrollY + rect.top - 80;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        } else {
          visible.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);

    const measureTimer1 = window.setTimeout(measureTarget, 120);
    const measureTimer2 = window.setTimeout(measureTarget, 420);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(measureTimer1);
      window.clearTimeout(measureTimer2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [isOpen, step, onSwitchTab, findVisibleTarget, measureTarget]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setStepIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const computeCardPosition = useCallback(() => {
    const card = cardRef.current;
    if (!card || typeof window === 'undefined') return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const margin = isMobile ? 10 : 14;
    const gap = isMobile ? 10 : 14;
    const cardRect = card.getBoundingClientRect();
    const cardW = cardRect.width || Math.min(420, vw - margin * 2);
    const cardH = cardRect.height || (isMobile ? 190 : 320);

    if (!targetRect) {
      const left = Math.max(margin, (vw - cardW) / 2);
      const top = Math.max(margin, Math.min(vh - cardH - margin, (vh - cardH) / 2));
      setCardPos({ left, top });
      return;
    }

    if (isMobile) {
      const left = Math.max(margin, (vw - cardW) / 2);
      const targetCenterY = targetRect.top + targetRect.height / 2;
      // Place compact tutorial bar on the opposite vertical side of the highlighted region
      const preferredTop =
        targetCenterY > vh * 0.56 ? margin : vh - cardH - margin;
      const top = Math.max(margin, Math.min(vh - cardH - margin, preferredTop));
      setCardPos({ left, top });
      return;
    }

    const spaceBelow = vh - targetRect.bottom - margin;
    const spaceAbove = targetRect.top - margin;
    const spaceRight = vw - targetRect.right - margin;
    const spaceLeft = targetRect.left - margin;

    let left = targetRect.left + targetRect.width / 2 - cardW / 2;
    let top = (vh - cardH) / 2;

    if (spaceBelow >= cardH + gap) {
      top = targetRect.bottom + gap;
    } else if (spaceAbove >= cardH + gap) {
      top = targetRect.top - cardH - gap;
    } else if (spaceRight >= cardW + gap) {
      left = targetRect.right + gap;
      top = targetRect.top + targetRect.height / 2 - cardH / 2;
    } else if (spaceLeft >= cardW + gap) {
      left = targetRect.left - cardW - gap;
      top = targetRect.top + targetRect.height / 2 - cardH / 2;
    } else {
      left = vw - cardW - margin - 8;
      top = vh - cardH - margin - 8;
    }

    left = Math.max(margin, Math.min(vw - cardW - margin, left));
    top = Math.max(margin, Math.min(vh - cardH - margin, top));

    setCardPos({ left, top });
  }, [targetRect]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeCardPosition();
  }, [isOpen, stepIndex, targetRect, showTipOnMobile, computeCardPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => computeCardPosition();
    window.addEventListener('resize', onResize);

    const cardEl = cardRef.current;
    let observer: ResizeObserver | null = null;
    if (cardEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => computeCardPosition());
      observer.observe(cardEl);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [isOpen, computeCardPosition]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1;
  const progressPct = ((stepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  return createPortal(
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial interactivo de MesaPoker"
    >
      {/* Backdrop & Spotlight Cutout */}
      {targetRect ? (
        <>
          <div
            className="fixed inset-0 pointer-events-auto"
            onClick={onClose}
            style={{ background: 'transparent' }}
          />
          <div
            className="fixed pointer-events-none rounded-2xl transition-all duration-300"
            style={{
              left: `${targetRect.left}px`,
              top: `${targetRect.top}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
              boxShadow: '0 0 0 9999px rgba(5, 7, 11, 0.72)',
              border: `2px solid ${accentHex}`,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Compact Mobile Card / Clean Desktop Card */}
      <div
        ref={cardRef}
        className="fixed z-[92] w-[calc(100vw-20px)] sm:w-[calc(100vw-28px)] max-w-[380px] sm:max-w-[420px] max-h-[44dvh] sm:max-h-[calc(100dvh-28px)] overflow-y-auto rounded-2xl bg-[#12151C]/95 backdrop-blur-md border border-white/15 p-3 sm:p-5 shadow-2xl space-y-2 sm:space-y-3"
        style={
          cardPos
            ? {
                left: `${cardPos.left}px`,
                top: `${cardPos.top}px`,
              }
            : {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Meta + Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-400 min-w-0">
            <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" style={{ color: accentHex }} />
            <span className="truncate">{step.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular shrink-0">
              {stepIndex + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Compact Chapter Selector on Mobile */}
            <select
              aria-label="Saltar a sección"
              value={
                step.category === 'Inicio'
                  ? 0
                  : step.category === 'Reloj'
                    ? 2
                    : step.category === 'Estructura'
                      ? 9
                      : step.category === 'Liga'
                        ? 11
                        : step.category === 'Botes'
                          ? 12
                          : 13
              }
              onChange={(e) => setStepIndex(Number(e.target.value))}
              className="sm:hidden min-h-[28px] rounded-lg bg-[#181C26] border border-white/10 px-1.5 text-[11px] text-slate-200"
            >
              <option value={0}>Inicio</option>
              <option value={2}>Reloj</option>
              <option value={9}>Estructura</option>
              <option value={11}>Liga</option>
              <option value={12}>Botes</option>
              <option value={13}>Ajustes</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[30px] min-w-[30px] sm:min-h-[34px] sm:min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
              aria-label="Cerrar tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress */}
        <div className="h-1 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: accentHex }}
          />
        </div>

        {/* Title & Concise Explanation */}
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-snug sm:leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Tip: inline expandable on mobile, visible box on sm+ */}
        <div className="sm:hidden">
          {showTipOnMobile ? (
            <div className="rounded-lg bg-[#181C26] border border-white/[0.06] px-2.5 py-1.5 flex items-start gap-2 text-[11px] text-slate-300 leading-snug">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
              <span>{step.tip}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTipOnMobile(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300/90 hover:text-amber-200 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ver consejo</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex rounded-xl bg-[#181C26] border border-white/[0.06] px-3 py-2 items-start gap-2 text-xs text-slate-300 leading-relaxed">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
          <span>{step.tip}</span>
        </div>

        {/* Desktop Quick Chapter Jump */}
        <div className="hidden sm:flex flex-wrap items-center gap-1.5">
          {[
            { label: 'Reloj', idx: 2 },
            { label: 'Estructura', idx: 9 },
            { label: 'Liga', idx: 11 },
            { label: 'Botes', idx: 12 },
            { label: 'Ajustes', idx: 13 },
          ].map((ch) => {
            const active = step.category === ch.label;
            return (
              <button
                key={ch.label}
                type="button"
                onClick={() => setStepIndex(ch.idx)}
                className={`min-h-[28px] px-2.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'bg-[#181C26] text-slate-400 hover:text-white'
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>

        {/* Compact Single-Row Footer */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              setExploreMode(!exploreMode);
              onClose();
            }}
            className="min-h-[34px] sm:min-h-[38px] flex items-center gap-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{exploreMode ? 'Salir explorar' : 'Explorar'}</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 flex items-center gap-1 rounded-xl bg-[#181C26] hover:bg-[#222735] disabled:opacity-35 text-[11px] sm:text-xs font-medium text-white cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Ant.</span>
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[34px] sm:min-h-[38px] px-3.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                Finalizar
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1))
                }
                className="min-h-[34px] sm:min-h-[38px] px-3 sm:px-4 flex items-center gap-1 rounded-xl text-[11px] sm:text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
