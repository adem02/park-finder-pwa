import {
  BadRequestError,
  ConflictError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
} from '@application/errors/gateway.errors';
import { InvalidReportError } from '@domain/availability/spot-count';
import { InvalidCommentContentError } from '@domain/comment/comment-content';

/** Message lisible pour une erreur de la page détail (chargement, signalement, commentaire). */
export function parkingErrorMessage(error: Error): string {
  if (error instanceof NotFoundError) return 'Ce parking n’existe pas ou a été retiré.';
  if (error instanceof NetworkError) {
    return error.reason === 'offline'
      ? 'Vous êtes hors ligne. Cette action demande une connexion.'
      : 'Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.';
  }
  if (error instanceof UnauthorizedError) return 'Votre session a expiré. Reconnectez-vous.';
  if (error instanceof InvalidReportError) {
    return `Indiquez un nombre de places entre 0 et ${error.totalSpots}.`;
  }
  if (error instanceof InvalidCommentContentError) {
    return error.reason === 'empty'
      ? 'Écrivez quelque chose avant de publier.'
      : 'Votre commentaire est trop long (500 caractères maximum).';
  }
  if (error instanceof BadRequestError || error instanceof ConflictError) return error.details;
  return 'Une erreur inattendue est survenue. Réessayez.';
}
