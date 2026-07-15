import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Keeps nonessential motion aligned with the device accessibility setting. */
export function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (isMounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Keep the standard motion language if the system preference is unavailable.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
