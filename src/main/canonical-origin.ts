type CurrentLocation = Pick<Location, 'origin' | 'pathname' | 'search' | 'hash'>;

/**
 * Adresse publique de l'app (ex. https://placegratos.fr). Ouverte depuis une autre adresse
 * (domaines Firebase par défaut), l'app y renvoie : ailleurs, le cookie de session de l'API
 * ne passerait pas, car il est réservé au même site (SameSite=Strict).
 */
export class CanonicalOrigin {
  constructor(private readonly origin: string | undefined) {}

  /** URL équivalente sur l'adresse publique, ou null si on y est déjà (ou si rien n'est configuré). */
  redirectTarget(location: CurrentLocation): string | null {
    if (!this.origin || location.origin === this.origin) return null;
    return `${this.origin}${location.pathname}${location.search}${location.hash}`;
  }
}
