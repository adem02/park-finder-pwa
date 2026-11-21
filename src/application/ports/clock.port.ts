/** Source de l'heure courante : la fraîcheur d'un signalement dépend du moment présent. */
export interface Clock {
  now(): Date;
}
