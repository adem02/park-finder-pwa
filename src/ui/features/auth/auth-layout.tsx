import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ParkingIcon } from '../../components/icons';
import styles from './auth.module.css';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Cadre commun connexion / inscription, avec la bascule entre les deux (DS P3). */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className={styles.page}>
      <p className={styles.brand}>
        <ParkingIcon width={28} height={28} />
        PlaceGratos
      </p>

      <div className={styles.card}>
        <nav className={styles.tabs} aria-label="Connexion ou inscription">
          <Link to="/login" search={true} className={styles.tab}>
            Connexion
          </Link>
          <Link to="/register" search={true} className={styles.tab}>
            Inscription
          </Link>
        </nav>

        <header className={styles.intro}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>

        {children}
      </div>
    </main>
  );
}
