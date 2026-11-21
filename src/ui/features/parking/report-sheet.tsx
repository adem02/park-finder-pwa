import { useState } from 'react';
import type { ParkingDetails } from '@domain/parking/parking-details';
import { Button } from '../../components/button';
import { Sheet } from '../../components/sheet';
import { Stepper } from '../../components/stepper';
import styles from './parking-details-page.module.css';

interface ReportSheetProps {
  open: boolean;
  parking: ParkingDetails;
  now: Date;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (spots: number) => void;
}

/** « Combien de places libres ? » : stepper de 0 (plein) au total, raccourci « C'est plein ». */
export function ReportSheet({ open, parking, now, submitting, onClose, onSubmit }: ReportSheetProps) {
  return (
    <Sheet open={open} title="Signaler la disponibilité" onClose={onClose}>
      {open && (
        <ReportForm
          parking={parking}
          initialSpots={parking.availableSpotsAt(now) ?? Math.round(parking.totalSpots / 2)}
          submitting={submitting}
          onSubmit={onSubmit}
        />
      )}
    </Sheet>
  );
}

function ReportForm({
  parking,
  initialSpots,
  submitting,
  onSubmit,
}: {
  parking: ParkingDetails;
  initialSpots: number;
  submitting: boolean;
  onSubmit: (spots: number) => void;
}) {
  const [spots, setSpots] = useState(initialSpots);

  return (
    <form
      className={styles.reportForm}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(spots);
      }}
    >
      <Stepper
        label={`Places libres sur ${parking.totalSpots}`}
        value={spots}
        min={0}
        max={parking.totalSpots}
        onChange={setSpots}
      />
      <Button variant="ghost" onClick={() => setSpots(0)} disabled={spots === 0}>
        C’est plein
      </Button>
      <Button type="submit" block loading={submitting}>
        Envoyer
      </Button>
    </form>
  );
}
