/** Codes posés par l'API sur `/login?oauthError=` quand une connexion sociale n'aboutit pas. */
export type OAuthErrorCode = 'google_unavailable' | 'google_failed';

const MESSAGES: Record<OAuthErrorCode, string> = {
  google_unavailable: 'La connexion avec Google n’est pas encore disponible. Utilisez votre email.',
  google_failed: 'La connexion avec Google a été annulée ou n’a pas abouti. Réessayez.',
};

export const isOAuthErrorCode = (value: unknown): value is OAuthErrorCode =>
  typeof value === 'string' && Object.hasOwn(MESSAGES, value);

export const oauthErrorMessage = (code: OAuthErrorCode): string => MESSAGES[code];
