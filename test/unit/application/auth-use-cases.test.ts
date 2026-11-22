import { describe, expect, it } from 'vitest';
import {
  EmailAlreadyUsedError,
  UsernameAlreadyTakenError,
  WrongCredentialsError,
} from '@application/auth/auth.errors';
import { Login } from '@application/auth/login.use-case';
import { Logout } from '@application/auth/logout.use-case';
import { Register } from '@application/auth/register.use-case';
import { RestoreSession } from '@application/auth/restore-session.use-case';
import { NetworkError } from '@application/errors/gateway.errors';
import type { AuthGateway } from '@application/ports/auth.gateway';
import { InvalidCredentialsInputError } from '@domain/auth/credentials';
import { err } from '@domain/shared/result';
import { DEMO_ACCOUNT, InMemoryAuthGateway } from '@infrastructure/in-memory/in-memory-auth.gateway';

const signedOut = () => new InMemoryAuthGateway({ signedIn: false });

describe('Login', () => {
  it('connecte avec les bons identifiants', async () => {
    const auth = signedOut();

    const result = await new Login(auth).execute(DEMO_ACCOUNT);

    expect(result.ok && result.value.email).toBe(DEMO_ACCOUNT.email);
    expect((await auth.resume()).ok).toBe(true);
  });

  it('traduit le refus du serveur en WrongCredentialsError', async () => {
    const result = await new Login(signedOut()).execute({ email: DEMO_ACCOUNT.email, password: 'Faux123!' });

    expect(!result.ok && result.error).toBeInstanceOf(WrongCredentialsError);
  });

  it('n’appelle pas le serveur si le formulaire est invalide', async () => {
    let called = false;
    const auth = { login: () => ((called = true), Promise.resolve(err(new NetworkError('offline')))) };

    const result = await new Login(auth as unknown as AuthGateway).execute({ email: 'nope', password: '' });

    expect(!result.ok && result.error).toBeInstanceOf(InvalidCredentialsInputError);
    expect(called).toBe(false);
  });
});

describe('Register', () => {
  it('crée le compte et ouvre la session', async () => {
    const auth = signedOut();

    const result = await new Register(auth).execute({
      email: 'camille@parkfinder.app',
      username: 'camille',
      password: 'Secret1!',
    });

    expect(result.ok && result.value.username).toBe('camille');
    expect((await auth.resume()).ok).toBe(true);
  });

  it('traduit un email déjà pris (409) en EmailAlreadyUsedError', async () => {
    const result = await new Register(signedOut()).execute({
      email: DEMO_ACCOUNT.email,
      username: 'autre',
      password: 'Secret1!',
    });

    expect(!result.ok && result.error).toBeInstanceOf(EmailAlreadyUsedError);
  });
});

describe('Register : pseudo déjà pris', () => {
  it('traduit la 409 UsernameAlreadyTakenException en UsernameAlreadyTakenError', async () => {
    const result = await new Register(signedOut()).execute({
      email: 'autre@parkfinder.app',
      username: 'vous',
      password: 'Secret1!',
    });

    expect(!result.ok && result.error).toBeInstanceOf(UsernameAlreadyTakenError);
  });
});

describe('RestoreSession et Logout', () => {
  it('rend l’utilisateur de la session en cours, puis null après déconnexion', async () => {
    const auth = new InMemoryAuthGateway();
    const restore = new RestoreSession(auth);

    const before = await restore.execute();
    await new Logout(auth).execute();
    const after = await restore.execute();

    expect(before.ok && before.value?.username).toBe('Vous');
    expect(after.ok && after.value).toBeNull();
  });

  it('remonte une erreur réseau au lieu de déconnecter', async () => {
    const auth = { resume: () => Promise.resolve(err(new NetworkError('offline'))) };

    const result = await new RestoreSession(auth as unknown as AuthGateway).execute();

    expect(!result.ok && result.error).toBeInstanceOf(NetworkError);
  });
});
