import { DomainError } from '../shared/domain-error';
import { err, ok, type Result } from '../shared/result';
import type { MonthlyRankSnapshot } from '../user/user-profile';

export class InvalidMonthError extends DomainError {
  readonly kind = 'InvalidMonth';

  constructor(readonly value: string) {
    super(`Mois invalide : ${value} (attendu AAAA-MM).`);
  }
}

/** Un mois du classement (`YearMonth` de l'API, ex. « 2026-11 »). */
export class YearMonth {
  private constructor(
    readonly year: number,
    /** 1 à 12. */
    readonly month: number,
  ) {}

  static of(date: Date): YearMonth {
    return new YearMonth(date.getFullYear(), date.getMonth() + 1);
  }

  static parse(value: string): Result<YearMonth, InvalidMonthError> {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    const month = match ? Number(match[2]) : 0;
    return match && month >= 1 && month <= 12
      ? ok(new YearMonth(Number(match[1]), month))
      : err(new InvalidMonthError(value));
  }

  previous(): YearMonth {
    return this.month === 1 ? new YearMonth(this.year - 1, 12) : new YearMonth(this.year, this.month - 1);
  }

  next(): YearMonth {
    return this.month === 12 ? new YearMonth(this.year + 1, 1) : new YearMonth(this.year, this.month + 1);
  }

  isBefore(other: YearMonth): boolean {
    return this.year < other.year || (this.year === other.year && this.month < other.month);
  }

  /** Premier jour du mois, pour l'affichage (« novembre 2026 »). */
  toDate(): Date {
    return new Date(this.year, this.month - 1, 1);
  }

  toString(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}`;
  }
}

export interface LeaderboardEntrySnapshot {
  readonly rank: number;
  readonly userId: string;
  readonly username: string;
  readonly photoUrl: string | null;
  readonly monthlyPoints: number;
}

export interface LeaderboardSnapshot {
  readonly month: string;
  readonly entries: readonly LeaderboardEntrySnapshot[];
  /** Rang de l'utilisateur connecté, `null` s'il n'a pas de points ce mois-ci. */
  readonly userRank: MonthlyRankSnapshot | null;
}

/** Classement mensuel (décisions : classement mensuel, pas par ville en MVP). */
export class Leaderboard {
  private constructor(private readonly snapshot: LeaderboardSnapshot) {}

  static fromSnapshot(snapshot: LeaderboardSnapshot): Leaderboard {
    return new Leaderboard(snapshot);
  }

  get month(): string {
    return this.snapshot.month;
  }

  get entries(): readonly LeaderboardEntrySnapshot[] {
    return this.snapshot.entries;
  }

  get userRank(): MonthlyRankSnapshot | null {
    return this.snapshot.userRank;
  }

  /** L'utilisateur apparaît-il dans la liste affichée ? Sinon on rappelle son rang en bas. */
  includes(userId: string): boolean {
    return this.snapshot.entries.some((entry) => entry.userId === userId);
  }

  toSnapshot(): LeaderboardSnapshot {
    return this.snapshot;
  }
}
