const MINUTE_MS = 60_000;

/** Un signalement est « récent » pendant 10 min, puis « ancien », et expire à 15 min (docs/decisions.md). */
export const AVAILABILITY_RECENT_MS = 10 * MINUTE_MS;
export const AVAILABILITY_EXPIRATION_MS = 15 * MINUTE_MS;

export type Freshness = 'recent' | 'stale' | 'expired' | 'none';

/** Niveau affiché par le badge : gris, rouge, orange ou vert. */
export type AvailabilityLevel = 'unknown' | 'full' | 'low' | 'ok';

export interface AvailabilitySnapshot {
  readonly availableSpots: number | null;
  readonly reportedAt: string | null;
}

export class Availability {
  private constructor(
    readonly availableSpots: number | null,
    readonly reportedAt: Date | null,
  ) {}

  static none(): Availability {
    return new Availability(null, null);
  }

  static reported(availableSpots: number, reportedAt: Date): Availability {
    return new Availability(availableSpots, reportedAt);
  }

  static fromSnapshot(snapshot: AvailabilitySnapshot): Availability {
    if (snapshot.availableSpots === null || snapshot.reportedAt === null) {
      return Availability.none();
    }
    return new Availability(snapshot.availableSpots, new Date(snapshot.reportedAt));
  }

  freshness(now: Date): Freshness {
    if (this.availableSpots === null || this.reportedAt === null) return 'none';

    const ageMs = now.getTime() - this.reportedAt.getTime();
    if (ageMs >= AVAILABILITY_EXPIRATION_MS) return 'expired';
    return ageMs < AVAILABILITY_RECENT_MS ? 'recent' : 'stale';
  }

  /** Nombre de places signalées, ou null si aucun signalement valide à cet instant. */
  spotsAt(now: Date): number | null {
    const freshness = this.freshness(now);
    return freshness === 'recent' || freshness === 'stale' ? this.availableSpots : null;
  }

  /** Gris si pas d'info, rouge si 0, orange si moins d'un tiers du total, vert sinon. */
  level(totalSpots: number, now: Date): AvailabilityLevel {
    const spots = this.spotsAt(now);
    if (spots === null) return 'unknown';
    if (spots === 0) return 'full';
    return spots < totalSpots / 3 ? 'low' : 'ok';
  }

  toSnapshot(): AvailabilitySnapshot {
    return {
      availableSpots: this.availableSpots,
      reportedAt: this.reportedAt?.toISOString() ?? null,
    };
  }
}
