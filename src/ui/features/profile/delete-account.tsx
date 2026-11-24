import { useState } from 'react';
import { Button } from '../../components/button';
import { Sheet } from '../../components/sheet';
import { useToast } from '../../components/toast';
import { formError } from '../auth/messages';
import { useDeleteAccount } from '../auth/use-session';
import styles from './profile.module.css';

/**
 * Suppression du compte (RGPD), avec confirmation : la feuille dit ce qui est effacé et ce qui
 * reste, avant l'action définitive. Après coup, la session se ferme et la garde renvoie à la connexion.
 */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const deletion = useDeleteAccount();
  const toast = useToast();

  const confirm = () =>
    deletion.mutate(undefined, {
      onSuccess: () => toast('Votre compte a été supprimé.', 'success'),
    });

  return (
    <>
      <Button variant="ghost" block onClick={() => setOpen(true)}>
        Supprimer mon compte
      </Button>

      <Sheet open={open} title="Supprimer votre compte ?" onClose={() => setOpen(false)}>
        <div className={styles.deleteSheet}>
          <p>
            Votre e-mail, votre pseudo, vos points, vos badges et vos commentaires seront effacés.
          </p>
          <p>
            Les parkings que vous avez ajoutés resteront sur la carte, au nom de PlaceGratos, et vos
            votes et signalements seront conservés de façon anonyme.
          </p>
          <p>
            <strong>Cette action est définitive.</strong>
          </p>

          {deletion.isError && (
            <p className={styles.deleteError} role="alert">
              {formError(deletion.error) ?? 'La suppression a échoué. Réessayez.'}
            </p>
          )}

          <Button variant="danger" block loading={deletion.isPending} onClick={confirm}>
            Supprimer définitivement
          </Button>
          <Button variant="secondary" block onClick={() => setOpen(false)}>
            Annuler
          </Button>
        </div>
      </Sheet>
    </>
  );
}
