export interface Env {
  readonly dataSource: 'demo' | 'api';
  readonly apiUrl: string;
  /** Adresse publique de l'app, sans `/` final. Absente en local : pas de redirection. */
  readonly canonicalOrigin?: string;
}

export function readEnv(): Env {
  return {
    dataSource: import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'demo',
    apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    canonicalOrigin: import.meta.env.VITE_CANONICAL_ORIGIN?.replace(/\/+$/, '') || undefined,
  };
}
