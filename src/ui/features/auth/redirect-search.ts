/** `?redirect=` des écrans de connexion : la page à rouvrir une fois connecté. */
export interface RedirectSearch {
  readonly redirect?: string;
}

/**
 * Seuls les chemins internes sont acceptés (`/list?radius=5000`), jamais `//site.com` ni une URL
 * absolue : sinon un lien piégé pourrait renvoyer l'utilisateur vers un autre site après connexion.
 */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined;
  return value;
}

export const validateRedirectSearch = (raw: Record<string, unknown>): RedirectSearch => {
  const redirect = safeRedirect(raw.redirect);
  return redirect ? { redirect } : {};
};
