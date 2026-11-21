import { useState, type FormEvent } from 'react';
import { useContainer } from '../../app/container-context';
import { Button } from '../../components/button';
import { PasswordField } from '../../components/password-field';
import { TextField } from '../../components/text-field';
import { AuthLayout } from './auth-layout';
import { fieldErrors, formError } from './messages';
import { useLogin } from './use-session';
import styles from './auth.module.css';

/**
 * Connexion. Une fois connecté, rien à faire ici : la session change et la route
 * redirige d'elle-même vers la page demandée (`?redirect=`) ou la carte.
 */
export function LoginPage() {
  const { demoAccount } = useContainer();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const errors = fieldErrors(login.error);
  const generalError = formError(login.error);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <AuthLayout
      title="Content de vous revoir"
      subtitle="Connectez-vous pour signaler des places, voter et ajouter des parkings."
    >
      <form className={styles.form} noValidate onSubmit={submit}>
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />

        {generalError && (
          <p className={styles.formError} role="alert">
            {generalError}
          </p>
        )}

        <Button type="submit" block loading={login.isPending}>
          Se connecter
        </Button>

        {demoAccount && (
          <p className={styles.demo}>
            Mode démo : {demoAccount.email} / {demoAccount.password}
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
