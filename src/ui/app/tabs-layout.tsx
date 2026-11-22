import { Link, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { preloadMapViewWhenIdle } from '../map/load-map-view';
import { ListIcon, MapIcon, UserIcon } from '../components/icons';
import styles from './tabs-layout.module.css';

/** Écrans principaux (Carte, Liste, Profil) avec la tab bar du DS. Les filtres de l'URL suivent d'un onglet à l'autre. */
export function TabsLayout() {
  useEffect(preloadMapViewWhenIdle, []);

  return (
    <div className={styles.layout}>
      <Outlet />
      <nav className={styles.tabBar} aria-label="Navigation principale">
        <Link to="/" search={true} className={styles.tab} activeOptions={{ exact: true, includeSearch: false }}>
          <MapIcon />
          Carte
        </Link>
        <Link to="/list" search={true} className={styles.tab} activeOptions={{ includeSearch: false }}>
          <ListIcon />
          Liste
        </Link>
        <Link to="/profile" search={true} className={styles.tab} activeOptions={{ includeSearch: false }}>
          <UserIcon />
          Profil
        </Link>
      </nav>
    </div>
  );
}
