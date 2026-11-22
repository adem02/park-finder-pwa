import { useState, type FormEvent } from 'react';
import { PasswordPolicy, type PasswordCheck } from '@domain/auth/credentials';
import { Button } from '../../components/button';
import { CheckIcon } from '../../components/icons';
import { PasswordField } from '../../components/password-field';
import { TextField } from '../../components/text-field';
import { AuthLayout } from './auth-layout';
import { GoogleButton } from './google-button';
import { fieldErrors, formError } from './messages';
import { useRegister } from './use-session';
import styles from './auth.module.css';

const PASSWORD_RULES: readonly { key: keyof PasswordCheck; label: string }[] = [
  { key: 'length', label: '6 à 20 caractères' },
  { key: 'uppercase', label: 'Une majuscule' },
  { key: 'lowercase', label: 'Une minuscule' },
  { key: 'digit', label: 'Un chiffre' },
  { key: 'special', label: 'Un caractère spécial' },
];

export function RegisterPage() {
  const register = useRegister();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const errors = fieldErrors(register.error);
  const generalError = formError(register.error);
  const check = PasswordPolicy.check(password);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    register.mutate({ email, username, password });
  };

  return (
    <AuthLayout
      title="Rejoignez la communauté"
      subtitle="Créez votre compte pour partager les places libres et gagner des points."
    >
      <form className={styles.form} noValidate onSubmit={submit}>
        <TextField
          label="Nom d’utilisateur"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="Votre pseudo, visible des autres"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={errors.username}
        />
        <TextField
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="nom@exemple.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <PasswordField
          label="Mot de passe"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          hint={
            <ul className={styles.rules} aria-label="Critères du mot de passe">
              {PASSWORD_RULES.map((rule) => (
                <li key={rule.key} className={styles.rule} data-met={check[rule.key] || undefined}>
                  <CheckIcon width={14} height={14} />
                  {rule.label}
                  <span className={styles.visuallyHidden}>
                    {check[rule.key] ? ' : respecté' : ' : à respecter'}
                  </span>
                </li>
              ))}
            </ul>
          }
        />

        {generalError && (
          <p className={styles.formError} role="alert">
            {generalError}
          </p>
        )}

        <Button type="submit" block loading={register.isPending}>
          Créer mon compte
        </Button>

        <GoogleButton />
      </form>
    </AuthLayout>
  );
}
