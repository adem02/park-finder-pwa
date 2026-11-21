import { FilterIcon } from '../../components/icons';
import styles from './search.module.css';

interface FiltersButtonProps {
  activeCount: number;
  onClick: () => void;
}

/** Bouton « Filtres » avec le nombre de critères actifs en pastille. */
export function FiltersButton({ activeCount, onClick }: FiltersButtonProps) {
  const label =
    activeCount > 0
      ? `Filtres, ${activeCount} actif${activeCount > 1 ? 's' : ''}`
      : 'Filtres';

  return (
    <button type="button" className={styles.filtersButton} aria-label={label} title={label} onClick={onClick}>
      <FilterIcon width={20} height={20} />
      {activeCount > 0 && (
        <span className={styles.filtersCount} aria-hidden="true">
          {activeCount}
        </span>
      )}
    </button>
  );
}
