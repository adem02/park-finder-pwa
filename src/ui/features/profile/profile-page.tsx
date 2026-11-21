import { Link } from '@tanstack/react-router';
import type { CurrentUser } from '@domain/user/current-user';
import type { UserProfile } from '@domain/user/user-profile';
import { Avatar } from '../../components/avatar';
import { Button } from '../../components/button';
import { ChevronRightIcon, TrophyIcon } from '../../components/icons';
import { formatPoints, formatRank } from '../../format/format-rank';
import { useCountUp } from '../../hooks/use-count-up';
import { useLogout } from '../auth/use-session';
import { nearbyErrorMessage } from '../search/messages';
import { useMyProfile } from './use-profile';
import styles from './profile.module.css';

interface ProfilePageProps {
  /** Utilisateur de la session : l'en-tête s'affiche avant que le profil complet arrive. */
  user: CurrentUser;
}

/** Onglet « Profil » (US6, DS P8) : niveau, stats, badges, rang du mois, parkings ajoutés. */
export function ProfilePage({ user }: ProfilePageProps) {
  const profile = useMyProfile();
  const logout = useLogout();

  return (
    <main className={styles.page}>
      <header className={styles.identityCard}>
        <Avatar author={user} size={64} />
        <div className={styles.identity}>
          <h1 className={styles.username}>{user.username}</h1>
          {user.email && <p className={styles.email}>{user.email}</p>}
          {profile.data && <p className={styles.levelBadge}>Niveau {profile.data.level.level}</p>}
        </div>
      </header>

      {profile.isPending && (
        <div className={styles.skeleton} role="status" aria-label="Chargement du profil" />
      )}

      {profile.isError && (
        <p className={styles.error} role="alert">
          {nearbyErrorMessage(profile.error).replace('les parkings', 'votre profil')}{' '}
          <button type="button" className={styles.retry} onClick={() => void profile.refetch()}>
            Réessayer
          </button>
        </p>
      )}

      {profile.data && <ProfileContent profile={profile.data} />}

      <Button variant="secondary" block loading={logout.isPending} onClick={() => logout.mutate()}>
        Se déconnecter
      </Button>
    </main>
  );
}

function ProfileContent({ profile }: { profile: UserProfile }) {
  const { level, stats, monthlyRank } = profile;

  return (
    <>
      <section className={styles.card} aria-labelledby="level-title">
        <div className={styles.levelHeader}>
          <h2 id="level-title" className={styles.cardTitle}>
            Progression
          </h2>
          <span className={styles.points}>{formatPoints(level.points)}</span>
        </div>
        <div
          className={styles.levelBar}
          role="progressbar"
          aria-label={`Progression vers le niveau ${level.level + 1}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(profile.levelProgress * 100)}
        >
          <span style={{ width: `${profile.levelProgress * 100}%` }} />
        </div>
        <p className={styles.caption}>
          {level.pointsToNextLevel} point{level.pointsToNextLevel > 1 ? 's' : ''} avant le niveau{' '}
          {level.level + 1}
        </p>
      </section>

      <section aria-label="Mes contributions">
        <ul className={styles.stats}>
          <Stat label="Parkings ajoutés" value={stats.parkingsAdded} />
          <Stat label="Signalements" value={stats.reportsCount} />
          <Stat label="Votes" value={stats.votesCount} />
        </ul>
        {!profile.hasContributed() && (
          <p className={styles.caption}>
            Signalez une place libre (+5), votez (+1) ou ajoutez un parking (+20) pour gagner vos
            premiers points.
          </p>
        )}
      </section>

      <Link to="/leaderboard" className={`${styles.card} ${styles.rankCard}`}>
        <TrophyIcon className={styles.rankIcon} width={28} height={28} />
        <span className={styles.rankText}>
          {monthlyRank ? (
            <>
              <strong>{formatRank(monthlyRank.rank)} ce mois-ci</strong>
              <span className={styles.caption}>
                Top {monthlyRank.percentile} · {formatPoints(monthlyRank.monthlyPoints)}
              </span>
            </>
          ) : (
            <>
              <strong>Classement du mois</strong>
              <span className={styles.caption}>Gagnez des points pour y figurer.</span>
            </>
          )}
        </span>
        <ChevronRightIcon width={18} height={18} />
      </Link>

      <section className={styles.card} aria-labelledby="badges-title">
        <h2 id="badges-title" className={styles.cardTitle}>
          Badges
        </h2>
        {profile.badges.length > 0 ? (
          <ul className={styles.badges}>
            {profile.badges.map((badge) => (
              <li key={badge.id} className={styles.badge}>
                {badge.iconUrl ? (
                  <img src={badge.iconUrl} alt="" width={40} height={40} />
                ) : (
                  <TrophyIcon width={40} height={40} />
                )}
                <span>
                  <strong>{badge.name}</strong>
                  <span className={styles.caption}>{badge.description}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.caption}>
            Aucun badge pour l’instant. <strong>Explorer</strong> : 10 parkings ajoutés.{' '}
            <strong>Precise</strong> : 90 % de votes positifs sur vos parkings.
          </p>
        )}
      </section>

      <section className={styles.card} aria-labelledby="parkings-title">
        <h2 id="parkings-title" className={styles.cardTitle}>
          Mes parkings
        </h2>
        {profile.recentParkings.length > 0 ? (
          <ul className={styles.contributions}>
            {profile.recentParkings.map((parking) => (
              <li key={parking.id}>
                <Link
                  to="/parking/$parkingId"
                  params={{ parkingId: parking.id }}
                  className={styles.contribution}
                >
                  <span className={styles.contributionName}>{parking.name}</span>
                  <span className={styles.caption}>
                    Score {parking.score > 0 ? `+${parking.score}` : parking.score} ·{' '}
                    {parking.votesCount} vote
                    {parking.votesCount > 1 ? 's' : ''}
                  </span>
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.caption}>
            Vous n’avez pas encore ajouté de parking.{' '}
            <Link to="/add" className={styles.inlineLink}>
              En ajouter un
            </Link>
          </p>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const shown = useCountUp(value);
  return (
    <li className={styles.stat}>
      <span className={styles.statValue} aria-hidden="true">
        {shown}
      </span>
      <span className={styles.statLabel}>
        <span className={styles.visuallyHidden}>{value} </span>
        {label}
      </span>
    </li>
  );
}
