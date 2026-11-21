import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router';
import { IconButton } from './icon-button';
import { ArrowLeftIcon } from './icons';

/** Retour à l'écran précédent, ou à la carte si on arrive directement (lien partagé). */
export function BackButton({ variant = 'floating', className }: { variant?: 'floating' | 'plain'; className?: string }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const navigate = useNavigate();

  return (
    <IconButton
      label="Retour"
      variant={variant}
      className={className}
      onClick={() => {
        if (canGoBack) router.history.back();
        else void navigate({ to: '/' });
      }}
    >
      <ArrowLeftIcon />
    </IconButton>
  );
}
