import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { NotFoundError } from '@application/errors/gateway.errors';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useUseCases } from '../../app/container-context';
import { AvailabilityBadge } from '../../components/availability-badge';
import { BackButton } from '../../components/back-button';
import { Button } from '../../components/button';
import {
  ChatIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  FlagIcon,
  NavigateIcon,
} from '../../components/icons';
import { useToast } from '../../components/toast';
import { formatDistance } from '../../format/format-distance';
import { useNow } from '../../hooks/use-now';
import { useSession } from '../auth/use-session';
import { useUserLocation } from '../location/use-user-location';
import { AddPhotos } from './add-photos';
import { CommentItem } from './comment-item';
import { DeleteParking } from './delete-parking';
import { DirectionsSheet } from './directions-sheet';
import { parkingErrorMessage } from './messages';
import { PhotosCarousel } from './photos-carousel';
import { ReportSheet } from './report-sheet';
import { useParkingDetails } from './use-parking-details';
import { useReportAvailability } from './use-report-availability';
import { useToggleVote } from './use-toggle-vote';
import { VoteButtons } from './vote-buttons';
import commentStyles from './comments.module.css';
import styles from './parking-details-page.module.css';

export function ParkingDetailsPage({ parkingId }: { parkingId: ParkingId }) {
  const { getDirections } = useUseCases();
  const details = useParkingDetails(parkingId);
  const location = useUserLocation();
  const now = useNow();
  const showToast = useToast();
  const toggleVote = useToggleVote();
  const report = useReportAvailability();
  const session = useSession();
  const [sheet, setSheet] = useState<'report' | 'directions' | null>(null);

  const parking = details.data;
  const directions = useMemo(
    () =>
      parking ? getDirections.execute({ destination: parking.coordinates, label: parking.name }) : [],
    [getDirections, parking],
  );

  if (details.isPending) {
    return (
      <main className={styles.page}>
        <div className={styles.headerBar}>
          <BackButton />
        </div>
        <div className={styles.skeletonPhoto} />
        <div className={styles.body} role="status" aria-label="Chargement du parking">
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLineShort} />
        </div>
      </main>
    );
  }

  if (!parking) {
    const isMissing = details.error instanceof NotFoundError;
    return (
      <main className={styles.state}>
        <h1 className={styles.stateTitle}>{isMissing ? 'Parking introuvable' : 'Chargement impossible'}</h1>
        <p className={styles.stateText}>
          {details.error ? parkingErrorMessage(details.error) : 'Une erreur est survenue.'}
        </p>
        {isMissing ? (
          <Link to="/" className={styles.stateLink}>
            Retour à la carte
          </Link>
        ) : (
          <Button onClick={() => void details.refetch()}>Réessayer</Button>
        )}
      </main>
    );
  }

  const distance =
    location.data?.source === 'device'
      ? location.data.position.distanceTo(parking.coordinates)
      : null;

  const submitReport = (spots: number) => {
    report.mutate(
      { parking, spots },
      {
        onSuccess: () => {
          setSheet(null);
          showToast('Merci ! Signalement enregistré (+5 points).');
        },
        onError: (error) => showToast(parkingErrorMessage(error), 'error'),
      },
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.headerBar}>
        <BackButton />
      </div>

      <PhotosCarousel parkingId={parking.id} photos={parking.photos} name={parking.name} />

      <div className={styles.body}>
        <AddPhotos parking={parking} />

        <header className={styles.titleBlock}>
          <h1 className={styles.title}>{parking.name}</h1>
          <div className={styles.tags}>
            {parking.isVerified() && (
              <span className={styles.verified}>
                <CheckBadgeIcon />
                Vérifié
              </span>
            )}
            {distance !== null && <span className={styles.tag}>à {formatDistance(distance)}</span>}
            <span className={styles.tag}>Gratuit</span>
          </div>
          <p className={styles.meta}>
            {parking.totalSpots} place{parking.totalSpots > 1 ? 's' : ''} au total · ajouté par{' '}
            {parking.addedBy.username}
          </p>
        </header>

        <section className={styles.card} aria-labelledby="availability-title">
          <h2 id="availability-title" className={styles.cardTitle}>
            Disponibilité
          </h2>
          <AvailabilityBadge
            availability={parking.availability}
            totalSpots={parking.totalSpots}
            now={now}
          />
          <Button
            variant="secondary"
            block
            icon={<FlagIcon width={18} height={18} />}
            onClick={() => setSheet('report')}
          >
            Signaler la disponibilité
          </Button>
        </section>

        <section className={styles.card} aria-labelledby="votes-title">
          <h2 id="votes-title" className={styles.cardTitle}>
            Ce parking est-il fiable ?
          </h2>
          <VoteButtons
            votes={parking.votes}
            disabled={toggleVote.isPending}
            onToggle={(type) => toggleVote.mutate({ parking, type })}
          />
        </section>

        <section className={styles.section} aria-labelledby="comments-title">
          <div className={styles.sectionHeader}>
            <h2 id="comments-title" className={styles.cardTitle}>
              Derniers commentaires
            </h2>
            <Link
              to="/parking/$parkingId/comments"
              params={{ parkingId: parking.id }}
              className={styles.seeAll}
            >
              {parking.recentComments.length > 0 ? 'Tout voir' : 'Écrire'}
              <ChevronRightIcon width={16} height={16} />
            </Link>
          </div>
          {parking.recentComments.length > 0 ? (
            <ul className={commentStyles.list}>
              {parking.recentComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} now={now} />
              ))}
            </ul>
          ) : (
            <p className={commentStyles.empty}>
              <ChatIcon width={16} height={16} /> Aucun commentaire pour l’instant.
            </p>
          )}
        </section>

        {session.data?.id === parking.addedBy.id && <DeleteParking parkingId={parking.id} />}
      </div>

      <footer className={styles.footer}>
        <Button
          block
          icon={<NavigateIcon width={20} height={20} />}
          onClick={() => setSheet('directions')}
        >
          Y aller
        </Button>
      </footer>

      <ReportSheet
        open={sheet === 'report'}
        parking={parking}
        now={now}
        submitting={report.isPending}
        onClose={() => setSheet(null)}
        onSubmit={submitReport}
      />
      <DirectionsSheet
        open={sheet === 'directions'}
        links={directions}
        onClose={() => setSheet(null)}
      />
    </main>
  );
}
