import { DuplicateParkingError } from '@application/parking/add-parking.use-case';
import { NetworkError, UnauthorizedError } from '@application/errors/gateway.errors';
import { PhotoTooLargeError, type PhotoError } from '@application/ports/photo-processor.port';
import {
  InvalidNewParkingError,
  PARKING_NAME_MAX_LENGTH,
  PARKING_NAME_MIN_LENGTH,
  PARKING_SPOTS_MAX,
  PARKING_SPOTS_MIN,
  type NewParkingProblem,
} from '@domain/parking/new-parking';

export function nameMessage(problem: NewParkingProblem | null): string | null {
  switch (problem) {
    case 'required':
      return 'Donnez un nom au parking.';
    case 'too-short':
      return `Au moins ${PARKING_NAME_MIN_LENGTH} caractères.`;
    case 'too-long':
      return `${PARKING_NAME_MAX_LENGTH} caractères maximum.`;
    default:
      return null;
  }
}

export const spotsMessage = (problem: NewParkingProblem | null): string | null =>
  problem ? `Entre ${PARKING_SPOTS_MIN} et ${PARKING_SPOTS_MAX} places.` : null;

export const photoErrorMessage = (error: PhotoError): string =>
  error instanceof PhotoTooLargeError
    ? 'Photo trop lourde, même après compression.'
    : 'Format non pris en charge. Choisissez une photo JPEG, PNG ou WebP.';

export function addParkingErrorMessage(error: Error): string {
  if (error instanceof DuplicateParkingError) {
    return 'Un parking existe déjà à moins de 50 m. Déplacez le repère ou consultez le parking existant.';
  }
  if (error instanceof InvalidNewParkingError) return 'Certaines informations sont incomplètes.';
  if (error instanceof UnauthorizedError) return 'Votre session a expiré. Reconnectez-vous.';
  if (error instanceof NetworkError) {
    return error.reason === 'offline'
      ? 'Vous êtes hors ligne. L’ajout d’un parking nécessite une connexion.'
      : 'L’envoi a échoué (réseau lent ou serveur injoignable). Réessayez.';
  }
  return 'L’ajout a échoué. Réessayez dans un instant.';
}
