import {
  InvalidResponseError,
  NetworkError,
  ServerError,
  UnauthorizedError,
} from '@application/errors/gateway.errors';

export function nearbyErrorMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return error.reason === 'offline'
      ? 'Vous êtes hors ligne. Les derniers parkings chargés restent affichés.'
      : 'Le serveur ne répond pas. Vérifiez votre connexion puis réessayez.';
  }
  if (error instanceof UnauthorizedError) return 'Votre session a expiré. Reconnectez-vous.';
  if (error instanceof ServerError || error instanceof InvalidResponseError) {
    return 'Impossible de charger les parkings pour le moment. Réessayez dans un instant.';
  }
  return 'Une erreur inattendue est survenue.';
}
