import { Link } from '@tanstack/react-router';
import { AuthLayout } from './auth-layout';
import styles from './auth.module.css';

/**
 * Retour de la connexion Google. Au chargement, l'app restaure la session avec le cookie
 * posé par l'API : si ça a marché, la route redirige vers la carte avant même cet affichage.
 * Arriver ici veut donc dire que la session n'a pas pu être ouverte.
 */
export function OAuthCallbackPage() {
  return (
    <AuthLayout
      title="Connexion non aboutie"
      subtitle="La session n’a pas pu être ouverte après la connexion avec Google."
    >
      <p className={styles.formError} role="alert">
        Réessayez, ou connectez-vous avec votre email. Si le problème persiste, vérifiez que les
        cookies ne sont pas bloqués pour ParkFinder.
      </p>
      <Link to="/login" className={styles.textLink}>
        Retour à la connexion
      </Link>
    </AuthLayout>
  );
}
