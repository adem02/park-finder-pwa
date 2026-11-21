import {
  BadRequestError,
  ConflictError,
  NetworkError,
  NotFoundError,
  ServerError,
  UnauthorizedError,
  InvalidResponseError,
  type GatewayError,
} from '@application/errors/gateway.errors';
import { err, ok, type Result } from '@domain/shared/result';

export type QueryParams = Readonly<Record<string, string | number | boolean | undefined>>;

export interface FetchHttpClientOptions {
  readonly baseUrl: string;
  readonly fetchFn?: typeof fetch;
  readonly timeoutMs?: number;
  readonly getAccessToken?: () => string | null;
  readonly isOnline?: () => boolean;
}

interface RequestOptions {
  readonly query?: QueryParams;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Client HTTP minimal au-dessus de fetch. Il traduit les échecs en GatewayError
 * et laisse remonter les annulations volontaires (TanStack Query les gère).
 */
export class FetchHttpClient {
  constructor(private readonly options: FetchHttpClientOptions) {}

  getJson(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<Result<unknown, GatewayError>> {
    return this.request('GET', path, options);
  }

  postJson(path: string, body: unknown, options: Omit<RequestOptions, 'body'> = {}): Promise<Result<unknown, GatewayError>> {
    return this.request('POST', path, { ...options, body });
  }

  delete(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<Result<unknown, GatewayError>> {
    return this.request('DELETE', path, options);
  }

  private async request(
    method: string,
    path: string,
    { query, body, signal }: RequestOptions,
  ): Promise<Result<unknown, GatewayError>> {
    const fetchFn = this.options.fetchFn ?? globalThis.fetch.bind(globalThis);
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetchFn(this.buildUrl(path, query), {
        method,
        headers: this.buildHeaders(body !== undefined),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (timeout.aborted) return err(new NetworkError('timeout'));
      return err(new NetworkError(this.isOnline() ? 'unreachable' : 'offline'));
    }

    if (response.status === 401) return err(new UnauthorizedError());
    if (response.status === 404) return err(new NotFoundError());
    if (response.status === 400) return err(new BadRequestError(await readErrorMessage(response)));
    if (response.status === 409) return err(new ConflictError(await readErrorMessage(response)));
    if (!response.ok) return err(new ServerError(response.status));

    const text = await response.text();
    if (text.length === 0) return ok(undefined);
    try {
      return ok(JSON.parse(text) as unknown);
    } catch {
      return err(new InvalidResponseError('le corps de la réponse n’est pas du JSON valide'));
    }
  }

  private buildUrl(path: string, query: QueryParams | undefined): string {
    const url = new URL(path, this.options.baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private buildHeaders(hasBody: boolean): Headers {
    const headers = new Headers({ Accept: 'application/json' });
    const token = this.options.getAccessToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (hasBody) headers.set('Content-Type', 'application/json');
    return headers;
  }

  private isOnline(): boolean {
    return this.options.isOnline?.() ?? globalThis.navigator?.onLine ?? true;
  }
}

/** NestJS renvoie `{ statusCode, message }`, où `message` peut être une liste (validation). */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (Array.isArray(body.message)) return body.message.map(String).join(', ');
    if (typeof body.message === 'string') return body.message;
  } catch {
    // corps absent ou illisible : message générique
  }
  return `HTTP ${response.status}`;
}
