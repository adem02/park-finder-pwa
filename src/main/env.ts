export interface Env {
  readonly dataSource: 'demo' | 'api';
  readonly apiUrl: string;
}

export function readEnv(): Env {
  return {
    dataSource: import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'demo',
    apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  };
}
