import type { Result } from '@domain/shared/result';

/** TanStack Query attend une promesse rejetée en cas d'échec : on convertit le Result. */
export async function unwrap<T, E extends Error>(result: Promise<Result<T, E>>): Promise<T> {
  const resolved = await result;
  if (!resolved.ok) throw resolved.error;
  return resolved.value;
}
