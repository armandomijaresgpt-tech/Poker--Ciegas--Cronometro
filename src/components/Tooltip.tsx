import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Compass, X } from 'lucide-react';

interface ActiveTooltipState {
  id: string;
  title?: string;
  content: string;
  rect: DOMRect;
  placement: 'top' | 'bottom';
  pinned: boolean;
}

interface TooltipContextValue {
  enabled: boolean;
  exploreMode: boolean;
  setExploreMode: React.Dispatch<React.SetStateAction<boolean>>;
  activeTooltip: ActiveTooltipState | null;
  openTooltip: (
    id: string,
    content: string,
    el: HTMLElement,
    options?: { title?: string; placement?: 'top' | 'bottom'; pinned?: boolean }
  ) => void;
  closeTooltip: (id?: string) => void;
}

const TooltipContext = createContext<TooltipContextValue>({
  enabled: true,
  exploreMode: false,
  setExploreMode: () => {},
  activeTooltip: null,
  openTooltip: () => {},
  closeTooltip: () => {},
});

export function useTooltipContext() {
  return useContext(TooltipContext);
}

interface TooltipProviderProps {
  enabled: boolean;
  accentHex?: string;
  children: React.ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({
  enabled,
  accentHex = '#E11D48',
  children,
}) => {
  const [exploreMode, setExploreMode] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);

  const openTooltip = useCallback(
    (
      id: string,
      content: string,
      el: HTMLElement,
      options?: { title?: string; placement?: 'top' | 'bottom'; pinned?: boolean }
    ) => {
      if (!enabled && !options?.pinned) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      setActiveTooltip({
        id,
        title: options?.title,
        content,
        rect,
        placement: options?.placement ?? 'top',
        pinned: Boolean(options?.pinned),
      });
    },
    [enabled]
  );

  const closeTooltip = useCallback((id?: string) => {
    setActiveTooltip((prev) => {
      if (!prev) return null;
      if (id && prev.id !== id) return prev;
      return null;
    });
  }, []);

  useEffect(() => {
    if (!activeTooltip) return;
    const handleScrollOrResize = () => {
      if (!activeTooltip.pinned) {
        setActiveTooltip(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTooltip(null);
        if (exploreMode) setExploreMode(false);
      }
    };
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTooltip, exploreMode]);

  useEffect(() => {
    if (!exploreMode) {
      setActiveTooltip((prev) => (prev?.pinned ? null : prev));
    }
  }, [exploreMode]);

  return (
    <TooltipContext.Provider
      value={{
        enabled,
        exploreMode,
        setExploreMode,
        activeTooltip,
        openTooltip,
        closeTooltip,
      }}
    >
      {exploreMode && (
        <div
          className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-[85] max-w-[92vw] flex items-center gap-3 rounded-2xl bg-[#181C26]/95 border px-4 py-2.5 shadow-2xl backdrop-blur-md text-xs sm:text-sm text-white"
          style={{ borderColor: accentHex }}
        >
          <Compass className="w-4 h-4 shrink-0" style={{ color: accentHex }} />
          <span className="leading-snug">
            Modo Explorar activo · Toca cualquier botón o panel para ver qué hace
          </span>
          <button
            type="button"
            onClick={() => {
              setExploreMode(false);
              setActiveTooltip(null);
            }}
            className="min-h-[34px] px-3 rounded-xl text-xs font-semibold text-white shrink-0 cursor-pointer"
            style={{ backgroundColor: accentHex }}
          >
            Salir
          </button>
        </div>
      )}
      {children}
      {activeTooltip && (
        <FloatingTooltipPortal
          tooltip={activeTooltip}
          accentHex={accentHex}
          onClose={() => setActiveTooltip(null)}
        />
      )}
    </TooltipContext.Provider>
  );
};

interface FloatingTooltipPortalProps {
  tooltip: ActiveTooltipState;
  accentHex: string;
  onClose: () => void;
}

const FloatingTooltipPortal: React.FC<FloatingTooltipPortalProps> = ({
  tooltip,
  accentHex,
  onClose,
}) => {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; ready: boolean }>({
    left: 16,
    top: 16,
    ready: false,
  });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const boxRect = box.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const gap = 10;

    // Horizontal center over target, clamped inside viewport
    let left = tooltip.rect.left + tooltip.rect.width / 2 - boxRect.width / 2;
    left = Math.max(margin, Math.min(vw - boxRect.width - margin, left));

    // Vertical preferred placement with automatic flip if clipped
    let top =
      tooltip.placement === 'top'
        ? tooltip.rect.top - boxRect.height - gap
        : tooltip.rect.bottom + gap;

    if (tooltip.placement === 'top' && top < margin) {
      const below = tooltip.rect.bottom + gap;
      top = below + boxRect.height + margin <= vh ? below : margin;
    } else if (tooltip.placement === 'bottom' && top + boxRect.height + margin > vh) {
      const above = tooltip.rect.top - boxRect.height - gap;
      top = above >= margin ? above : vh - boxRect.height - margin;
    }

    // Strict final clamp so tooltip never exits viewport regardless of target position
    top = Math.max(margin, Math.min(vh - boxRect.height - margin, top));

    setCoords({ left, top, ready: true });
  }, [tooltip]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={boxRef}
      role="tooltip"
      className={`fixed z-[95] max-w-[min(320px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-xl bg-[#161A24] border border-white/15 px-3.5 py-2.5 shadow-2xl text-left transition-opacity duration-150 ${
        tooltip.pinned ? 'pointer-events-auto' : 'pointer-events-none'
      } ${coords.ready ? 'opacity-100' : 'opacity-0'}`}
      style={{
        left: `${coords.left}px`,
        top: `${coords.top}px`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          {tooltip.title && (
            <div
              className="text-xs font-bold leading-tight"
              style={{ color: accentHex }}
            >
              {tooltip.title}
            </div>
          )}
          <p className="text-xs text-slate-200 leading-relaxed">{tooltip.content}</p>
        </div>
        {tooltip.pinned && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[28px] min-w-[28px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] shrink-0 cursor-pointer"
            aria-label="Cerrar ayuda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

interface TooltipProps {
  content: string;
  title?: string;
  placement?: 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  placement = 'top',
  className = 'inline-flex',
  children,
}) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const touchTimerRef = useRef<number | null>(null);
  const { enabled, exploreMode, openTooltip, closeTooltip } = useTooltipContext();

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (touchTimerRef.current !== null) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handleMouseEnter = () => {
    if (!enabled && !exploreMode) return;
    if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
      return;
    }
    clearTimers();
    hoverTimerRef.current = window.setTimeout(() => {
      if (wrapperRef.current) {
        openTooltip(id, content, wrapperRef.current, {
          title,
          placement,
          pinned: false,
        });
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    clearTimers();
    if (!exploreMode) {
      closeTooltip(id);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!enabled && !exploreMode) return;
    const target = e.target as HTMLElement;
    if (target && typeof target.matches === 'function' && target.matches(':focus-visible')) {
      if (wrapperRef.current) {
        openTooltip(id, content, wrapperRef.current, {
          title,
          placement,
          pinned: false,
        });
      }
    }
  };

  const handleBlur = () => {
    if (!exploreMode) {
      closeTooltip(id);
    }
  };

  const handleTouchStart = () => {
    if (!enabled || exploreMode) return;
    clearTimers();
    touchTimerRef.current = window.setTimeout(() => {
      if (wrapperRef.current) {
        openTooltip(id, content, wrapperRef.current, {
          title,
          placement,
          pinned: true,
        });
      }
    }, 480);
  };

  const handleTouchEndOrMove = () => {
    if (touchTimerRef.current !== null) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!exploreMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (wrapperRef.current) {
      openTooltip(id, content, wrapperRef.current, {
        title,
        placement,
        pinned: true,
      });
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`${className} ${
        exploreMode ? 'outline-1 outline-dashed outline-amber-400/40 rounded-xl' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEndOrMove}
      onTouchMove={handleTouchEndOrMove}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
};
