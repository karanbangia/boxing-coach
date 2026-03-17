import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) {
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      return;
    }

    let cancelled = false;

    async function acquire() {
      try {
        if ('wakeLock' in navigator && !cancelled) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // WakeLock not supported or denied
      }
    }

    acquire();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active && !cancelled) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [active]);
}
