import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import {
  InvalidNewParkingError,
  nameProblem,
  totalSpotsProblem,
} from '@domain/parking/new-parking';
import { DuplicateParkingError } from '@application/parking/add-parking.use-case';
import { useContainer } from '../../app/container-context';
import { Button } from '../../components/button';
import { IconButton } from '../../components/icon-button';
import { ArrowLeftIcon, LocateIcon } from '../../components/icons';
import { useOnlineStatus } from '../../hooks/use-online-status';
import { useUserLocation } from '../location/use-user-location';
import { AddParkingSuccess } from './add-parking-success';
import { DetailsStep } from './details-step';
import { LocationStep } from './location-step';
import { addParkingErrorMessage, nameMessage, spotsMessage } from './messages';
import { PhotosStep } from './photos-step';
import { useAddParking, usePhotoDraft } from './use-add-parking';
import { useDuplicateCheck } from './use-duplicate-check';
import styles from './add-parking.module.css';

type Step = 1 | 2 | 3;

const STEP_TITLES: Record<Step, string> = {
  1: 'Position',
  2: 'Informations',
  3: 'Photos',
};

/** Ajout d'un parking (US3, DS P6) : Position → Informations → Photos (décision 1). */
export function AddParkingPage() {
  const { dataSource } = useContainer();
  const location = useUserLocation();
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [center, setCenter] = useState<CoordinatesSnapshot | null>(null);
  const [name, setName] = useState('');
  const [totalSpots, setTotalSpots] = useState(10);
  const [showDetailErrors, setShowDetailErrors] = useState(false);

  const position = center ?? location.data?.position.toSnapshot() ?? null;
  const { neighbours, duplicate } = useDuplicateCheck(position);
  const photos = usePhotoDraft();
  const add = useAddParking();

  if (add.data) {
    return <AddParkingSuccess parkingId={add.data} />;
  }

  if (!location.data || !position) {
    return (
      <main className={styles.loading} role="status">
        <LocateIcon className={styles.loadingIcon} width={32} height={32} />
        Recherche de votre position…
      </main>
    );
  }

  const nameError = showDetailErrors ? nameMessage(nameProblem(name)) : null;
  const spotsError = showDetailErrors ? spotsMessage(totalSpotsProblem(totalSpots)) : null;

  const back = () => {
    if (step > 1) setStep((step - 1) as Step);
    else if (canGoBack) router.history.back();
    else void navigate({ to: '/' });
  };

  const next = () => {
    if (step === 1 && !duplicate) setStep(2);
    if (step === 2) {
      setShowDetailErrors(true);
      if (!nameProblem(name) && !totalSpotsProblem(totalSpots)) setStep(3);
    }
  };

  const submit = () => {
    add.mutate(
      {
        name,
        totalSpots,
        latitude: position.latitude,
        longitude: position.longitude,
        photos: photos.ready,
      },
      {
        onSuccess: () => {
          if (dataSource === 'demo') photos.keep();
        },
        onError: (error) => {
          // Renvoie à l'étape où corriger.
          if (error instanceof DuplicateParkingError) setStep(1);
          if (
            error instanceof InvalidNewParkingError &&
            (error.problems.name || error.problems.totalSpots)
          ) {
            setShowDetailErrors(true);
            setStep(2);
          }
        },
      },
    );
  };

  return (
    <main className={styles.page} data-step={step}>
      <header className={styles.header}>
        <IconButton
          label={step > 1 ? 'Étape précédente' : 'Annuler'}
          variant="plain"
          onClick={back}
        >
          <ArrowLeftIcon />
        </IconButton>
        <div className={styles.headerTitles}>
          <h1 className={styles.title}>Ajouter un parking</h1>
          <p className={styles.stepLabel}>
            Étape {step} sur 3 · {STEP_TITLES[step]}
          </p>
        </div>
      </header>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label="Progression"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={step}
      >
        <span style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className={styles.body}>
        {step === 1 && (
          <LocationStep
            initialCenter={position}
            neighbours={neighbours}
            duplicate={duplicate}
            onCenterChange={setCenter}
          />
        )}
        {step === 2 && (
          <DetailsStep
            name={name}
            totalSpots={totalSpots}
            nameError={nameError}
            spotsError={spotsError}
            onNameChange={setName}
            onTotalSpotsChange={setTotalSpots}
          />
        )}
        {step === 3 && <PhotosStep draft={photos} />}
      </div>

      <footer className={styles.footer}>
        {step === 3 && add.error && (
          <p className={styles.submitError} role="alert">
            {addParkingErrorMessage(add.error)}
          </p>
        )}
        {step === 3 && !isOnline && (
          <p className={styles.submitError} role="status">
            Hors ligne : l’ajout d’un parking nécessite une connexion.
          </p>
        )}
        {step < 3 ? (
          <Button block onClick={next} disabled={step === 1 && duplicate !== null}>
            Suivant
          </Button>
        ) : (
          <Button
            block
            onClick={submit}
            loading={add.isPending}
            disabled={!isOnline || photos.isProcessing}
          >
            {photos.isProcessing ? 'Préparation des photos…' : 'Ajouter le parking'}
          </Button>
        )}
      </footer>
    </main>
  );
}
