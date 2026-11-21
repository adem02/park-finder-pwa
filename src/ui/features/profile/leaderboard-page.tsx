import { useState } from 'react';
import { YearMonth } from '@domain/leaderboard/leaderboard';
import type { CurrentUser } from '@domain/user/current-user';
import { useContainer } from '../../app/container-context';
import { Avatar } from '../../components/avatar';
import { BackButton } from '../../components/back-button';
import { IconButton } from '../../components/icon-button';
import { ArrowLeftIcon, ChevronRightIcon } from '../../components/icons';
import { formatMonth, formatPoints, formatRank } from '../../format/format-rank';
import { useLeaderboard } from './use-profile';
import styles from './profile.module.css';

const initialOf = (username: string) => username.trim().charAt(0).toUpperCase() || '?';

/** Classement mensuel (DS P8). Mois précédents consultables ; pas de classement par ville en MVP. */
export function LeaderboardPage({ user }: { user: CurrentUser }) {
  const { clock } = useContainer();
  const [current] = useState(() => YearMonth.of(clock.now()));
  const [month, setMonth] = useState(current);
  const leaderboard = useLeaderboard(month.toString());
  const board = leaderboard.data;

  return (
    <main className={styles.page}>
      <header className={styles.boardHeader}>
        <BackButton variant="plain" />
        <h1 className={styles.boardTitle}>Classement</h1>
      </header>

      <nav className={styles.monthNav} aria-label="Mois du classement">
        <IconButton
          label="Mois précédent"
          variant="plain"
          onClick={() => setMonth(month.previous())}
        >
          <ArrowLeftIcon width={20} height={20} />
        </IconButton>
        <p className={styles.monthLabel} aria-live="polite">
          {formatMonth(month.toDate())}
        </p>
        <IconButton
          label="Mois suivant"
          variant="plain"
          disabled={!month.isBefore(current)}
          onClick={() => setMonth(month.next())}
        >
          <ChevronRightIcon width={20} height={20} />
        </IconButton>
      </nav>

      {leaderboard.isPending && (
        <div className={styles.skeleton} role="status" aria-label="Chargement du classement" />
      )}
      {leaderboard.isError && (
        <p className={styles.error} role="alert">
          Impossible de charger le classement.{' '}
          <button type="button" className={styles.retry} onClick={() => void leaderboard.refetch()}>
            Réessayer
          </button>
        </p>
      )}

      {board &&
        (board.entries.length === 0 ? (
          <p className={styles.caption}>Personne n’a encore gagné de points ce mois-là.</p>
        ) : (
          <ol className={styles.board} aria-label={`Classement de ${formatMonth(month.toDate())}`}>
            {board.entries.map((entry) => {
              const isMe = entry.userId === user.id;
              return (
                <li
                  key={entry.userId}
                  className={styles.boardRow}
                  data-me={isMe || undefined}
                  data-rank={entry.rank}
                >
                  <span className={styles.boardRank}>{formatRank(entry.rank)}</span>
                  <Avatar
                    author={{ photoUrl: entry.photoUrl, initial: initialOf(entry.username) }}
                    size={36}
                  />
                  <span className={styles.boardName}>
                    {entry.username}
                    {isMe && <span className={styles.me}> (vous)</span>}
                  </span>
                  <span className={styles.boardPoints}>{formatPoints(entry.monthlyPoints)}</span>
                </li>
              );
            })}
          </ol>
        ))}

      {board?.userRank && !board.includes(user.id) && (
        <p className={styles.myRank}>
          Vous : {formatRank(board.userRank.rank)} · top {board.userRank.percentile} ·{' '}
          {formatPoints(board.userRank.monthlyPoints)}
        </p>
      )}
    </main>
  );
}
