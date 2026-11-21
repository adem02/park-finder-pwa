import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '../components/toast';
import { createQueryClient } from '../query/query-client';
import type { AppContainer } from './app-container';
import { ContainerProvider } from './container-context';
import { createAppRouter } from './router';
import { SessionGate } from './session-gate';

export function App({ container }: { container: AppContainer }) {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createAppRouter);

  return (
    <ContainerProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SessionGate router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ContainerProvider>
  );
}
