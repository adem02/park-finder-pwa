/** « Vérifié » si score net > 10, modération si score net ≤ -5 (docs/decisions.md). */
export const VERIFIED_NET_SCORE_THRESHOLD = 10;
export const MODERATION_NET_SCORE_THRESHOLD = -5;

export class ParkingScore {
  private constructor(
    readonly upvotes: number,
    readonly downvotes: number,
  ) {}

  static of(upvotes: number, downvotes: number): ParkingScore {
    return new ParkingScore(upvotes, downvotes);
  }

  get net(): number {
    return this.upvotes - this.downvotes;
  }

  isVerified(): boolean {
    return this.net > VERIFIED_NET_SCORE_THRESHOLD;
  }

  needsModeration(): boolean {
    return this.net <= MODERATION_NET_SCORE_THRESHOLD;
  }
}
