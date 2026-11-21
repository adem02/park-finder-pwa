import {
  InvalidResponseError,
  NetworkError,
  ServerError,
  UnauthorizedError,
} from '@application/errors/gateway.errors';
import type { GeolocationError } from '@application/ports/geolocation.port';

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

export function locationFallbackMessage(reason: GeolocationError['reason']): string {
  switch (reason) {
    case 'denied':
      return 'Localisation refusée : la carte est centrée sur Reims. Autorisez-la dans les réglages du navigateur pour voir les parkings autour de vous.';
    case 'unsupported':
      return 'Ce navigateur ne permet pas la localisation : la carte est centrée sur Reims.';
    case 'timeout':
    case 'unavailable':
      return 'Position introuvable pour l’instant : la carte est centrée sur Reims.';
  }
}
