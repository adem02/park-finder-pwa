import type { DirectionsLink } from '@application/ports/directions.port';
import { ChevronRightIcon, NavigateIcon } from '../../components/icons';
import { Sheet } from '../../components/sheet';
import styles from './parking-details-page.module.css';

interface DirectionsSheetProps {
  open: boolean;
  links: readonly DirectionsLink[];
  onClose: () => void;
}

/** « Y aller » : un lien par appli de navigation, ouvert dans un nouvel onglet ou dans l'appli. */
export function DirectionsSheet({ open, links, onClose }: DirectionsSheetProps) {
  return (
    <Sheet open={open} title="Y aller avec…" onClose={onClose}>
      <ul className={styles.directions}>
        {links.map((link) => (
          <li key={link.app}>
            <a
              className={styles.directionLink}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              <NavigateIcon width={20} height={20} />
              <span>{link.label}</span>
              <ChevronRightIcon width={18} height={18} />
            </a>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
