import type { ParkingVotes, VoteType } from '@domain/vote/parking-votes';
import { ThumbDownIcon, ThumbUpIcon } from '../../components/icons';
import styles from './vote-buttons.module.css';

interface VoteButtonsProps {
  votes: ParkingVotes;
  disabled?: boolean;
  onToggle: (type: VoteType) => void;
}

/** 👍 / 👎 : bleu si upvote actif, rouge si downvote actif, gris sinon (DS « États des boutons vote »). */
export function VoteButtons({ votes, disabled = false, onToggle }: VoteButtonsProps) {
  return (
    <div className={styles.group} role="group" aria-label="Votre avis sur ce parking">
      <button
        type="button"
        className={`${styles.vote} ${styles.up}`}
        aria-pressed={votes.userVote === 'UPVOTE'}
        aria-label={`Parking fiable, ${votes.upvotes} vote${votes.upvotes > 1 ? 's' : ''}`}
        disabled={disabled}
        onClick={() => onToggle('UPVOTE')}
      >
        <ThumbUpIcon width={20} height={20} />
        <span>{votes.upvotes}</span>
      </button>
      <button
        type="button"
        className={`${styles.vote} ${styles.down}`}
        aria-pressed={votes.userVote === 'DOWNVOTE'}
        aria-label={`Parking pas fiable, ${votes.downvotes} vote${votes.downvotes > 1 ? 's' : ''}`}
        disabled={disabled}
        onClick={() => onToggle('DOWNVOTE')}
      >
        <ThumbDownIcon width={20} height={20} />
        <span>{votes.downvotes}</span>
      </button>
    </div>
  );
}
