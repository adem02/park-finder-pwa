/** Prévient l'UI quand la session expire en cours d'utilisation (refresh token révoqué ou expiré). */
export interface SessionExpiryPort {
  /** Renvoie la fonction de désabonnement. */
  onExpired(listener: () => void): () => void;
}
