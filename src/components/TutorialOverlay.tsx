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
    const pad = 6;

    // Clamp spotlight rectangle strictly within the visible viewport
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    onSwitchTab(step.tab);

    const scrollTimer = window.setTimeout(() => {
      const visible = findVisibleTarget();
      if (visible) {
        const rect = visible.getBoundingClientRect();
        const vh = window.innerHeight;
        // If target is tall, align its top safely below the sticky header; otherwise center
        if (rect.height > vh * 0.55) {
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
    const margin = 14;
    const gap = 14;
    const cardRect = card.getBoundingClientRect();
    const cardW = cardRect.width || Math.min(440, vw - margin * 2);
    const cardH = cardRect.height || 360;

    // Default centered position (used when no targetRect)
    if (!targetRect) {
      const left = Math.max(margin, (vw - cardW) / 2);
      const top = Math.max(margin, Math.min(vh - cardH - margin, (vh - cardH) / 2));
      setCardPos({ left, top });
      return;
    }

    const isMobile = vw < 640;
    if (isMobile) {
      const left = Math.max(margin, (vw - cardW) / 2);
      const targetCenterY = targetRect.top + targetRect.height / 2;
      // Place card opposite to the highlighted area on mobile so it never covers it
      const preferredTop =
        targetCenterY > vh * 0.55
          ? margin
          : vh - cardH - margin;
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
      // Target fills most of viewport: anchor cleanly at bottom-right/center inside safe bounds
      left = vw - cardW - margin - 8;
      top = vh - cardH - margin - 8;
    }

    // Strict final viewport clamping so the card NEVER overflows any edge
    left = Math.max(margin, Math.min(vw - cardW - margin, left));
    top = Math.max(margin, Math.min(vh - cardH - margin, top));

    setCardPos({ left, top });
  }, [targetRect]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeCardPosition();
  }, [isOpen, stepIndex, targetRect, computeCardPosition]);

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
              boxShadow: '0 0 0 9999px rgba(5, 7, 11, 0.78)',
              border: `2px solid ${accentHex}`,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Tutorial Card — always clamped inside viewport with internal scroll fallback */}
      <div
        ref={cardRef}
        className="fixed z-[92] w-[calc(100vw-28px)] max-w-[440px] max-h-[calc(100dvh-28px)] overflow-y-auto rounded-2xl bg-[#12151C] border border-white/15 p-4 sm:p-5 shadow-2xl space-y-3.5"
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
        {/* Top Meta & Close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <GraduationCap className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
            <span>{step.category}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Paso {stepIndex + 1} de {TUTORIAL_STEPS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
            aria-label="Cerrar tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%`, backgroundColor: accentHex }}
          />
        </div>

        {/* Title & Explanation */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Tip */}
        <div className="rounded-xl bg-[#181C26] border border-white/[0.06] px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
          <span>{step.tip}</span>
        </div>

        {/* Quick Chapter Jump */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
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
                className={`min-h-[30px] px-2.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
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

        {/* Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={() => {
              setExploreMode(!exploreMode);
              onClose();
            }}
            className="min-h-[40px] flex items-center gap-1.5 px-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-amber-300" />
            <span>{exploreMode ? 'Salir de explorar' : 'Explorar botones'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
              className="min-h-[40px] px-3 flex items-center gap-1 rounded-xl bg-[#181C26] hover:bg-[#222735] disabled:opacity-35 text-xs font-medium text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[40px] px-4 rounded-xl text-xs font-semibold text-white cursor-pointer"
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
                className="min-h-[40px] px-4 flex items-center gap-1 rounded-xl text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: accentHex }}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
