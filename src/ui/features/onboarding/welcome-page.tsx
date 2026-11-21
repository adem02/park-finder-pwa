import { Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '../../components/button';
import { ParkingIcon, TrophyIcon, UsersIcon } from '../../components/icons';
import { OnboardingProgress } from './onboarding-progress';
import styles from './welcome.module.css';

interface Slide {
  readonly title: string;
  readonly text: string;
  readonly icon: ReactNode;
  readonly tone: 'primary' | 'success' | 'warning';
}

const SLIDES: readonly Slide[] = [
  {
    title: 'Trouvez une place gratuite',
    text: 'La carte montre les parkings gratuits autour de vous, avec les places libres signalées par la communauté.',
    icon: <ParkingIcon width={48} height={48} />,
    tone: 'primary',
  },
  {
    title: 'Partagez ce que vous voyez',
    text: 'Signalez les places libres, votez pour les parkings fiables et ajoutez ceux qui manquent.',
    icon: <UsersIcon width={48} height={48} />,
    tone: 'success',
  },
  {
    title: 'Gagnez des points',
    text: 'Chaque contribution rapporte des points : 20 par parking ajouté, 5 par signalement, 1 par vote. Montez de niveau et grimpez au classement.',
    icon: <TrophyIcon width={48} height={48} />,
    tone: 'warning',
  },
];

/** Onboarding (DS P2) : 3 écrans, « Passer » dès le premier, affiché une seule fois par appareil. */
export function WelcomePage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const isLast = index === SLIDES.length - 1;

  const goTo = (next: number) => {
    setIndex(next);
    const track = trackRef.current;
    track?.scrollTo?.({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  const finish = (to: '/login' | '/register') => {
    OnboardingProgress.markDone();
    void navigate({ to });
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>ParkFinder</span>
        {!isLast && (
          <button type="button" className={styles.skip} onClick={() => finish('/login')}>
            Passer
          </button>
        )}
      </header>

      <div
        ref={trackRef}
        className={styles.track}
        aria-roledescription="carrousel"
        aria-label="Présentation de ParkFinder"
        onScroll={(event) => {
          const track = event.currentTarget;
          if (track.clientWidth > 0) setIndex(Math.round(track.scrollLeft / track.clientWidth));
        }}
      >
        {SLIDES.map((slide, position) => (
          <section
            key={slide.title}
            className={styles.slide}
            aria-roledescription="diapositive"
            aria-label={`${position + 1} sur ${SLIDES.length}`}
            aria-hidden={position !== index}
          >
            <div className={`${styles.illustration} ${styles[slide.tone]}`}>{slide.icon}</div>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.text}>{slide.text}</p>
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.dots}>
          {SLIDES.map((slide, position) => (
            <button
              key={slide.title}
              type="button"
              className={styles.dot}
              aria-label={`Aller à l’écran ${position + 1}`}
              aria-current={position === index ? 'step' : undefined}
              onClick={() => goTo(position)}
            />
          ))}
        </div>

        {isLast ? (
          <>
            <Button block onClick={() => finish('/register')}>
              Créer un compte
            </Button>
            <Link to="/login" className={styles.secondary} onClick={() => OnboardingProgress.markDone()}>
              J’ai déjà un compte
            </Link>
          </>
        ) : (
          <Button block onClick={() => goTo(index + 1)}>
            Suivant
          </Button>
        )}
      </footer>
    </main>
  );
}
