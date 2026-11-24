import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ParkingHasContributionsError } from '@application/parking/delete-parking.use-case';
import type { ParkingId } from '@domain/parking/parking-summary';
import { Button } from '../../components/button';
import { Sheet } from '../../components/sheet';
import { useToast } from '../../components/toast';
import { parkingErrorMessage } from './messages';
import { useDeleteParking } from './use-delete-parking';
import styles from './parking-details-page.module.css';

const deletionErrorMessage = (error: Error): string =>
  error instanceof ParkingHasContributionsError
    ? 'D’autres utilisateurs ont déjà voté, commenté ou signalé sa disponibilité : ce parking appartient désormais à la communauté et ne peut plus être supprimé.'
    : parkingErrorMessage(error);

/** Réservé à l'auteur : retirer son parking (erreur, doublon) tant que personne d'autre n'y a contribué. */
export function DeleteParking({ parkingId }: { parkingId: ParkingId }) {
  const [open, setOpen] = useState(false);
  const deletion = useDeleteParking();
  const navigate = useNavigate();
  const toast = useToast();

  const confirm = () =>
    deletion.mutate(parkingId, {
      onSuccess: () => {
        toast('Parking supprimé.', 'success');
        void navigate({ to: '/', replace: true });
      },
    });

  return (
    <>
      <Button variant="ghost" block onClick={() => setOpen(true)}>
        Supprimer ce parking
      </Button>

      <Sheet open={open} title="Supprimer ce parking ?" onClose={() => setOpen(false)}>
        <div className={styles.deleteSheet}>
          <p>
            Il disparaîtra de la carte et vous perdrez les 20 points gagnés en l’ajoutant. C’est
            possible tant que personne d’autre n’a voté, commenté ou signalé sa disponibilité.
          </p>

          {deletion.isError && (
            <p className={styles.deleteError} role="alert">
              {deletionErrorMessage(deletion.error)}
            </p>
          )}

          <Button variant="danger" block loading={deletion.isPending} onClick={confirm}>
            Supprimer le parking
          </Button>
          <Button variant="secondary" block onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </Sheet>
    </>
  );
}
