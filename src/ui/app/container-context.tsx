import { createContext, use, type ReactNode } from 'react';
import type { AppContainer, UseCases } from './app-container';
import type { Clock } from '@application/ports/clock.port';

const ContainerContext = createContext<AppContainer | null>(null);

export function ContainerProvider({
  container,
  children,
}: {
  container: AppContainer;
  children: ReactNode;
}) {
  return <ContainerContext value={container}>{children}</ContainerContext>;
}

export function useContainer(): AppContainer {
  const container = use(ContainerContext);
  if (!container) throw new Error('ContainerProvider manquant autour de l’application.');
  return container;
}

export const useUseCases = (): UseCases => useContainer().useCases;

export const useClock = (): Clock => useContainer().clock;
