import { useId } from 'react';
import type { ParkingFilters } from '@domain/search/parking-filters';
import { Button } from '../../components/button';
import { ParkingIcon } from '../../components/icons';
import { formatDistance } from '../../format/format-distance';
import styles from './search.module.css';

interface ListEmptyStateProps {
  filters: ParkingFilters;
  onFiltersChange: (filters: ParkingFilters) => void;
}

/** Aucun résultat : propose de retirer les critères restrictifs et/ou d'élargir le rayon. */
export function ListEmptyState({ filters, onFiltersChange }: ListEmptyStateProps) {
  const restricted = filters.restrictsResults();
  const wider = filters.widerRadius();
  const radius = formatDistance(filters.radius.meters);
  const titleId = useId();

  return (
    <section className={styles.empty} aria-labelledby={titleId}>
      <ParkingIcon className={styles.emptyIcon} width={40} height={40} />
      <h2 id={titleId} className={styles.emptyTitle}>
        Aucun parking trouvé
      </h2>
      <p className={styles.emptyText}>
        {restricted
          ? `Aucun parking gratuit ne correspond à vos filtres dans un rayon de ${radius}.`
          : `Aucun parking gratuit n’est encore référencé dans un rayon de ${radius}.`}
      </p>
      <div className={styles.emptyActions}>
        {restricted && (
          <Button
            variant="secondary"
            onClick={() =>
              onFiltersChange(filters.reset('minSpots').reset('availableOnly').reset('verifiedOnly'))
            }
          >
            Retirer les filtres
          </Button>
        )}
        {wider && (
          <Button onClick={() => onFiltersChange(filters.withRadius(wider))}>
            Élargir à {formatDistance(wider.meters)}
          </Button>
        )}
      </div>
    </section>
  );
}
