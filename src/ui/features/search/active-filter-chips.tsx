import type { ParkingFilters } from '@domain/search/parking-filters';
import { CloseIcon } from '../../components/icons';
import { criterionLabel } from './filter-labels';
import styles from './search.module.css';

interface ActiveFilterChipsProps {
  filters: ParkingFilters;
  onChange: (filters: ParkingFilters) => void;
}

/** Critères actifs en pastilles : toucher une pastille retire ce critère. */
export function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const criteria = filters.activeCriteria();
  if (criteria.length === 0) return null;

  return (
    <ul className={styles.activeChips} aria-label="Filtres actifs">
      {criteria.map((criterion) => {
        const label = criterionLabel(criterion, filters);
        return (
          <li key={criterion}>
            <button
              type="button"
              className={styles.activeChip}
              aria-label={`Retirer le filtre ${label}`}
              onClick={() => onChange(filters.reset(criterion))}
            >
              {label}
              <CloseIcon width={14} height={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
