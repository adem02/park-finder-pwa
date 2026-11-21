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
      return 'ParkFinder a besoin de votre position pour trouver les parkings autour de vous. Autorisez la localisation dans les réglages du navigateur.';
    case 'unsupported':
      return 'Ce navigateur ne permet pas la localisation, nécessaire pour trouver les parkings autour de vous. Essayez avec un autre navigateur.';
    case 'timeout':
    case 'unavailable':
      return 'Position introuvable pour l’instant. Vérifiez que la localisation de l’appareil est activée, puis touchez le bouton « Me localiser ».';
  }
}
