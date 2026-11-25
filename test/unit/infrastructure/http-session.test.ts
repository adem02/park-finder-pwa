import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@application/errors/gateway.errors';
import { LoginCredentials } from '@domain/auth/credentials';
import { HttpAuthGateway } from '@infrastructure/http/http-auth.gateway';
import { HttpSession } from '@infrastructure/http/http-session';
import type { LockRunner } from '@infrastructure/http/token-refresher';

const BASE = 'https://api.parkfinder.test';
const USER = { id: 'u1', username: 'camille', email: 'camille@parkfinder.app' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Fausse API : un seul access token valide à la fois ; /auth/refresh en délivre un nouveau
 * tant que le « cookie » est valide.
 */
function fakeApi({ refreshAllowed = true } = {}) {
  let validToken = 'token-0';
  let issued = 0;
  const calls: { method: string; path: string; authorization: string | null; credentials?: string }[] = [];

  const fetchFn = vi.fn<typeof fetch>((input, init) => {
    const url = new URL(input as string);
    const headers = new Headers(init?.headers);
    const call = {
      method: init?.method ?? 'GET',
      path: url.pathname,
      authorization: headers.get('Authorization'),
      credentials: init?.credentials,
    };
    calls.push(call);

    if (call.path === '/auth/login') return Promise.resolve(json({ user: USER, accessToken: validToken }, 201));
    if (call.path === '/auth/refresh') {
      if (!refreshAllowed) return Promise.resolve(json({ message: 'Invalid' }, 401));
      issued += 1;
      validToken = `token-${issued}`;
      return Promise.resolve(json({ accessToken: validToken }));
    }
    if (call.path === '/auth/logout') return Promise.resolve(new Response(null, { status: 204 }));
    const authorized = call.authorization === `Bearer ${validToken}`;
    if (!authorized) return Promise.resolve(json({ message: 'Unauthorized' }, 401));
    if (call.path === '/users/me' && call.method === 'DELETE') return Promise.resolve(new Response(null, { status: 204 }));
    if (call.path === '/users/me') return Promise.resolve(json({ user: USER, stats: {} }));
    return Promise.resolve(json({ parkings: [] }));
  });

  return {
    fetchFn,
    calls,
    expireAccessToken: () => {
      validToken = 'rotated-elsewhere';
    },
    refreshCalls: () => calls.filter((c) => c.path === '/auth/refresh').length,
  };
}

const noLocks: LockRunner = (_name, task) => task();

const setup = (api: ReturnType<typeof fakeApi>) => {
  const session = new HttpSession({ baseUrl: BASE, fetchFn: api.fetchFn, isOnline: () => true }, noLocks);
  return { session, auth: new HttpAuthGateway(session) };
};

const credentials = () => {
  const result = LoginCredentials.create({ email: USER.email, password: 'Secret1!' });
  if (!result.ok) throw result.error;
  return result.value;
};

describe('HttpSession + HttpAuthGateway', () => {
  it('garde l’access token en mémoire et l’envoie ensuite, cookies inclus', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);

    const user = await auth.login(credentials());
    await session.http.getJson('/parkings');

    expect(user.ok && user.value.username).toBe('camille');
    const parkingsCall = api.calls.find((c) => c.path === '/parkings');
    expect(parkingsCall?.authorization).toBe('Bearer token-0');
    expect(parkingsCall?.credentials).toBe('include');
  });

  it('sur un 401, renouvelle le token une fois puis rejoue la requête', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);
    await auth.login(credentials());
    api.expireAccessToken();

    const result = await session.http.getJson('/parkings');

    expect(result.ok).toBe(true);
    expect(api.refreshCalls()).toBe(1);
    expect(api.calls.at(-1)?.authorization).toBe('Bearer token-1');
  });

  it('ne renouvelle qu’une fois quand plusieurs requêtes échouent en même temps', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);
    await auth.login(credentials());
    api.expireAccessToken();

    const results = await Promise.all([
      session.http.getJson('/parkings'),
      session.http.getJson('/parkings'),
      session.http.getJson('/parkings'),
    ]);

    expect(results.every((r) => r.ok)).toBe(true);
    expect(api.refreshCalls()).toBe(1);
  });

  it('si le renouvellement est refusé, oublie le token et prévient l’UI', async () => {
    const api = fakeApi({ refreshAllowed: false });
    const { session, auth } = setup(api);
    const expired = vi.fn();
    session.expiry.onExpired(expired);
    await auth.login(credentials());
    api.expireAccessToken();

    const result = await session.http.getJson('/parkings');

    expect(!result.ok && result.error).toBeInstanceOf(UnauthorizedError);
    expect(expired).toHaveBeenCalledOnce();
    expect(session.tokens.get()).toBeNull();
  });

  it('un 401 sur /auth/login ne déclenche pas de renouvellement', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(json({ message: 'Wrong email or password' }, 401));
    const session = new HttpSession({ baseUrl: BASE, fetchFn, isOnline: () => true }, noLocks);

    const result = await new HttpAuthGateway(session).login(credentials());

    expect(!result.ok && result.error).toBeInstanceOf(UnauthorizedError);
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('reprend une session avec le cookie : refresh puis /users/me', async () => {
    const api = fakeApi();
    const { auth } = setup(api);

    const user = await auth.resume();

    expect(user.ok && user.value.email).toBe(USER.email);
    expect(api.calls.map((c) => c.path)).toEqual(['/auth/refresh', '/users/me']);
  });

  it('se déconnecte côté appareil même si le serveur est injoignable', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);
    await auth.login(credentials());
    api.fetchFn.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await auth.logout();

    expect(session.tokens.get()).toBeNull();
  });

  it('supprime le compte avec DELETE /users/me puis oublie l’access token', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);
    await auth.login(credentials());

    const result = await auth.deleteAccount();

    expect(result.ok).toBe(true);
    const call = api.calls.find((c) => c.method === 'DELETE');
    expect(call).toMatchObject({ path: '/users/me', authorization: 'Bearer token-0' });
    expect(session.tokens.get()).toBeNull();
  });

  it('garde la session si la suppression échoue', async () => {
    const api = fakeApi();
    const { session, auth } = setup(api);
    await auth.login(credentials());
    api.fetchFn.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await auth.deleteAccount();

    expect(result.ok).toBe(false);
    expect(session.tokens.get()).toBe('token-0');
  });

  it('à l’ouverture, retente une fois si l’API se réveille encore (503), puis reprend la session', async () => {
    let refreshes = 0;
    const fetchFn = vi.fn<typeof fetch>((input) => {
      const path = new URL(input as string).pathname;
      if (path === '/auth/refresh') {
        refreshes += 1;
        return Promise.resolve(refreshes === 1 ? json({ message: 'starting' }, 503) : json({ accessToken: 'token-1' }));
      }
      return Promise.resolve(json({ user: USER, stats: {} }));
    });
    const session = new HttpSession({ baseUrl: BASE, fetchFn, isOnline: () => true }, noLocks);
    const auth = new HttpAuthGateway(session, () => Promise.resolve());

    const user = await auth.resume();

    expect(user.ok && user.value.username).toBe('camille');
    expect(refreshes).toBe(2);
  });

  it('ne retente pas un refus de session (401)', async () => {
    const api = fakeApi({ refreshAllowed: false });
    const session = new HttpSession({ baseUrl: BASE, fetchFn: api.fetchFn, isOnline: () => true }, noLocks);
    const auth = new HttpAuthGateway(session, () => Promise.resolve());

    const user = await auth.resume();

    expect(!user.ok && user.error).toBeInstanceOf(UnauthorizedError);
    expect(api.refreshCalls()).toBe(1);
  });
});
