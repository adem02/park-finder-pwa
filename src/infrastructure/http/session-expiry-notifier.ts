import type { SessionExpiryPort } from '@application/ports/session-expiry.port';

export class SessionExpiryNotifier implements SessionExpiryPort {
  private readonly listeners = new Set<() => void>();

  onExpired(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    for (const listener of this.listeners) listener();
  }
}
