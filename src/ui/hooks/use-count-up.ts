import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = (): boolean =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Compteur animé jusqu'à `target` (DS : stats du profil en count-up), depuis la valeur déjà affichée.
 * Sans animation possible ou souhaitée, la valeur finale est rendue directement.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const animate =
    target > 0 && typeof globalThis.requestAnimationFrame === 'function' && !prefersReducedMotion();
  const [value, setValue] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    if (!animate) return;
    const from = shownRef.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      // easeOutCubic : rapide au début, se pose en douceur.
      const next = Math.round(from + (target - from) * (1 - (1 - progress) ** 3));
      shownRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate, target, durationMs]);

  return animate ? value : target;
}
