import { useState } from 'react';
import { ParkingFilters, type ParkingFiltersSnapshot } from '@domain/search/parking-filters';
import { Button } from '../../components/button';
import { ChoiceChips } from '../../components/choice-chips';
import { Sheet } from '../../components/sheet';
import { Switch } from '../../components/switch';
import { MIN_SPOTS_CHOICES, RADIUS_CHOICES, SORT_CHOICES } from './filter-labels';
import styles from './search.module.css';

interface FiltersSheetProps {
  open: boolean;
  filters: ParkingFilters;
  onClose: () => void;
  onApply: (filters: ParkingFilters) => void;
}

/** Panneau « Filtres » : les choix restent un brouillon jusqu'à « Appliquer ». */
export function FiltersSheet({ open, filters, onClose, onApply }: FiltersSheetProps) {
  return (
    <Sheet open={open} title="Filtres" onClose={onClose}>
      {/* Démonté à la fermeture : chaque ouverture repart des filtres en cours. */}
      {open && (
        <FiltersForm
          initial={filters.toSnapshot()}
          onApply={(draft) => {
            onApply(ParkingFilters.fromSnapshot(draft));
            onClose();
          }}
        />
      )}
    </Sheet>
  );
}

function FiltersForm({
  initial,
  onApply,
}: {
  initial: ParkingFiltersSnapshot;
  onApply: (draft: ParkingFiltersSnapshot) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const change = (changes: Partial<ParkingFiltersSnapshot>) => setDraft((d) => ({ ...d, ...changes }));

  return (
    <form
      className={styles.filtersForm}
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <ChoiceChips
        legend="Rayon de recherche"
        options={RADIUS_CHOICES}
        value={draft.radiusMeters}
        onChange={(radiusMeters) => change({ radiusMeters })}
      />
      <ChoiceChips
        legend="Places au total"
        options={MIN_SPOTS_CHOICES}
        value={draft.minSpots}
        onChange={(minSpots) => change({ minSpots })}
      />
      <ChoiceChips
        legend="Trier par"
        options={SORT_CHOICES}
        value={draft.sort}
        onChange={(sort) => change({ sort })}
      />
      <div className={styles.switches}>
        <Switch
          label="Places disponibles uniquement"
          hint="Signalement de moins de 15 min avec au moins une place"
          checked={draft.availableOnly}
          onChange={(availableOnly) => change({ availableOnly })}
        />
        <Switch
          label="Parkings vérifiés uniquement"
          hint="Validés par la communauté"
          checked={draft.verifiedOnly}
          onChange={(verifiedOnly) => change({ verifiedOnly })}
        />
      </div>
      <div className={styles.filtersActions}>
        <Button variant="secondary" onClick={() => setDraft(ParkingFilters.DEFAULT.toSnapshot())}>
          Réinitialiser
        </Button>
        <Button type="submit">Appliquer</Button>
      </div>
    </form>
  );
}
