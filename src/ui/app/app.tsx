import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';
import { createQueryClient } from '../query/query-client';
import type { AppContainer } from './app-container';
import { ContainerProvider } from './container-context';
import { createAppRouter } from './router';

export function App({ container }: { container: AppContainer }) {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(createAppRouter);

  return (
    <ContainerProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ContainerProvider>
  );
}
