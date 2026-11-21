import { PARKING_SPOTS_MAX, PARKING_SPOTS_MIN } from '@domain/parking/new-parking';
import { Stepper } from '../../components/stepper';
import { TextField } from '../../components/text-field';
import styles from './add-parking.module.css';

interface DetailsStepProps {
  name: string;
  totalSpots: number;
  nameError: string | null;
  spotsError: string | null;
  onNameChange: (name: string) => void;
  onTotalSpotsChange: (spots: number) => void;
}

/** Étape 2 : nom (3 à 100 caractères) et nombre total de places (1 à 1000). */
export function DetailsStep({
  name,
  totalSpots,
  nameError,
  spotsError,
  onNameChange,
  onTotalSpotsChange,
}: DetailsStepProps) {
  return (
    <div className={styles.formStep}>
      <TextField
        label="Nom du parking"
        placeholder="Ex. Parking de la médiathèque"
        autoComplete="off"
        maxLength={120}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        error={nameError}
        hint="Un nom que les autres reconnaîtront sur place."
      />
      <div className={styles.spots}>
        <Stepper
          label="Nombre total de places"
          value={totalSpots}
          min={PARKING_SPOTS_MIN}
          max={PARKING_SPOTS_MAX}
          onChange={onTotalSpotsChange}
        />
        {spotsError && <p className={styles.fieldError}>{spotsError}</p>}
      </div>
    </div>
  );
}
