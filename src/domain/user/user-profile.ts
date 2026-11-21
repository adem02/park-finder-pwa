import { CurrentUser, type CurrentUserSnapshot } from './current-user';

export interface LevelSnapshot {
  readonly points: number;
  readonly level: number;
  readonly nextLevelThreshold: number;
  /** Points déjà gagnés dans le niveau en cours. */
  readonly progressToNextLevel: number;
  readonly pointsToNextLevel: number;
}

export interface BadgeSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly iconUrl: string;
}

export interface MonthlyRankSnapshot {
  readonly rank: number;
  /** Tel que fourni par l'API, ex. « 5% ». */
  readonly percentile: string;
  readonly monthlyPoints: number;
}

export interface ContributionSnapshot {
  readonly id: string;
  readonly name: string;
  /** Score net (votes positifs − négatifs). */
  readonly score: number;
  readonly votesCount: number;
}

export interface UserProfileSnapshot {
  readonly user: CurrentUserSnapshot;
  readonly stats: {
    readonly parkingsAdded: number;
    readonly reportsCount: number;
    readonly votesCount: number;
  };
  readonly level: LevelSnapshot;
  readonly badges: readonly BadgeSnapshot[];
  readonly monthlyRank: MonthlyRankSnapshot | null;
  readonly recentParkings: readonly ContributionSnapshot[];
}

/** Profil de l'utilisateur connecté (US6) : progression, contributions, badges, rang du mois. */
export class UserProfile {
  private constructor(private readonly snapshot: UserProfileSnapshot) {}

  static fromSnapshot(snapshot: UserProfileSnapshot): UserProfile {
    return new UserProfile(snapshot);
  }

  get user(): CurrentUser {
    return CurrentUser.fromSnapshot(this.snapshot.user);
  }

  get stats(): UserProfileSnapshot['stats'] {
    return this.snapshot.stats;
  }

  get level(): LevelSnapshot {
    return this.snapshot.level;
  }

  /** Avancement dans le niveau en cours, entre 0 et 1. */
  get levelProgress(): number {
    const { progressToNextLevel, pointsToNextLevel } = this.snapshot.level;
    const span = progressToNextLevel + pointsToNextLevel;
    return span > 0 ? Math.min(1, Math.max(0, progressToNextLevel / span)) : 0;
  }

  get badges(): readonly BadgeSnapshot[] {
    return this.snapshot.badges;
  }

  get monthlyRank(): MonthlyRankSnapshot | null {
    return this.snapshot.monthlyRank;
  }

  get recentParkings(): readonly ContributionSnapshot[] {
    return this.snapshot.recentParkings;
  }

  /** Nouveau venu : aucune contribution encore. */
  hasContributed(): boolean {
    const { parkingsAdded, reportsCount, votesCount } = this.snapshot.stats;
    return parkingsAdded + reportsCount + votesCount > 0;
  }

  toSnapshot(): UserProfileSnapshot {
    return this.snapshot;
  }
}
