import { describe, expect, it } from 'vitest';
import {
  InvalidCredentialsInputError,
  LoginCredentials,
  PasswordPolicy,
  Registration,
} from '@domain/auth/credentials';

const problemsOf = (result: { ok: boolean; error?: unknown }) =>
  !result.ok && result.error instanceof InvalidCredentialsInputError ? result.error.problems : null;

describe('LoginCredentials', () => {
  it('accepte un email valide (espaces retirés) et un mot de passe quelconque', () => {
    const result = LoginCredentials.create({ email: '  ahmed@parkfinder.app ', password: 'x' });

    expect(result.ok && result.value.email).toBe('ahmed@parkfinder.app');
  });

  it('signale les champs vides ou un email mal formé', () => {
    expect(problemsOf(LoginCredentials.create({ email: '', password: '' }))).toEqual({
      email: 'required',
      password: 'required',
    });
    expect(problemsOf(LoginCredentials.create({ email: 'ahmed@', password: 'x' }))).toEqual({
      email: 'invalid-email',
    });
  });
});

describe('Registration', () => {
  it('reprend les règles de l’API', () => {
    expect(Registration.create({ email: 'a@b.fr', username: 'camille', password: 'Secret1!' }).ok).toBe(
      true,
    );
    expect(problemsOf(Registration.create({ email: 'a@b.fr', username: 'ab', password: 'secret' }))).toEqual({
      username: 'too-short',
      password: 'weak',
    });
    expect(
      problemsOf(Registration.create({ email: 'a@b.fr', username: 'x'.repeat(51), password: 'Ab1!' })),
    ).toEqual({ username: 'too-long', password: 'too-short' });
  });
});

describe('PasswordPolicy', () => {
  it('détaille chaque critère pour la liste affichée pendant la saisie', () => {
    expect(PasswordPolicy.check('abc')).toEqual({
      length: false,
      lowercase: true,
      uppercase: false,
      digit: false,
      special: false,
    });
    expect(Object.values(PasswordPolicy.check('Secret1!')).every(Boolean)).toBe(true);
  });

  it('refuse plus de 20 caractères', () => {
    expect(PasswordPolicy.problem('Secret1!'.repeat(3))).toBe('too-long');
  });
});
