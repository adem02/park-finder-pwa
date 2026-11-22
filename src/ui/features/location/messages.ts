import type { GeolocationError } from '@application/ports/geolocation.port';

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
