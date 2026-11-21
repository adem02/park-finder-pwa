import { useEffect, useState } from 'react';
import { useClock } from '../app/container-context';

/** Heure courante rafraîchie régulièrement : les pins vieillissent à l'écran (récent → ancien → expiré). */
export function useNow(intervalMs = 30_000): Date {
  const clock = useClock();
  const [now, setNow] = useState(() => clock.now());

  useEffect(() => {
    const id = setInterval(() => setNow(clock.now()), intervalMs);
    return () => clearInterval(id);
  }, [clock, intervalMs]);

  return now;
}
