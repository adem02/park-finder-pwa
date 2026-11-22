import { ParkingScore } from './parking-score';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

/** Ce qu'il faut demander au serveur pour passer d'un état de vote à l'autre. */
export type VoteIntent = { readonly kind: 'vote'; readonly type: VoteType } | { readonly kind: 'cancel' };

export interface ParkingVotesSnapshot {
  readonly upvotes: number;
  readonly downvotes: number;
  readonly userVote: VoteType | null;
}

/** Votes d'un parking, vus par l'utilisateur courant (son vote inclus). */
export class ParkingVotes {
  private constructor(
    readonly upvotes: number,
    readonly downvotes: number,
    readonly userVote: VoteType | null,
  ) {}

  static of(upvotes: number, downvotes: number, userVote: VoteType | null): ParkingVotes {
    return new ParkingVotes(upvotes, downvotes, userVote);
  }

  static fromSnapshot(snapshot: ParkingVotesSnapshot): ParkingVotes {
    return new ParkingVotes(snapshot.upvotes, snapshot.downvotes, snapshot.userVote);
  }

  get score(): ParkingScore {
    return ParkingScore.of(this.upvotes, this.downvotes);
  }

  /**
   * Toucher un bouton de vote : même bouton = annuler, autre bouton = changer, aucun vote = voter.
   * Renvoie les votes attendus après l'action et la requête à envoyer.
   */
  toggle(type: VoteType): { readonly votes: ParkingVotes; readonly intent: VoteIntent } {
    const next = this.userVote === type ? null : type;
    const upvotes = this.upvotes - (this.userVote === 'UPVOTE' ? 1 : 0) + (next === 'UPVOTE' ? 1 : 0);
    const downvotes =
      this.downvotes - (this.userVote === 'DOWNVOTE' ? 1 : 0) + (next === 'DOWNVOTE' ? 1 : 0);

    return {
      votes: new ParkingVotes(upvotes, downvotes, next),
      intent: next === null ? { kind: 'cancel' } : { kind: 'vote', type: next },
    };
  }

  toSnapshot(): ParkingVotesSnapshot {
    return { upvotes: this.upvotes, downvotes: this.downvotes, userVote: this.userVote };
  }
}
