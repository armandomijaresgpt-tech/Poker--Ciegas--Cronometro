import { useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

export function useWakeLock(active: boolean) {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const nav = navigator as unknown as {
      wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
    };

    if (!active || !nav.wakeLock) {
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {});
      }
      sentinelRef.current = null;
      setIsWakeLockActive(false);
      return;
    }

    let cancelled = false;

    const requestLock = async () => {
      try {
        if (document.visibilityState !== 'visible') return;
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setIsWakeLockActive(true);
        sentinel.addEventListener?.('release', () => {
          setIsWakeLockActive(false);
        });
      } catch {
        setIsWakeLockActive(false);
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        requestLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sentinelRef.current && !sentinelRef.current.released) {
        sentinelRef.current.release().catch(() => {});
      }
      sentinelRef.current = null;
      setIsWakeLockActive(false);
    };
  }, [active]);

  return isWakeLockActive;
}
