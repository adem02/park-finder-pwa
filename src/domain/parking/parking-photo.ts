/** Une photo d'un parking. `isMine` : postée par l'utilisateur connecté, qui peut donc la retirer. */
export interface ParkingPhoto {
  readonly id: string;
  readonly url: string;
  readonly isMine: boolean;
}

/** Points gagnés par photo ajoutée à un parking existant (repris si on la retire). */
export const POINTS_PER_PHOTO = 5;
