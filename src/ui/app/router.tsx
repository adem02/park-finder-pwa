import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { MapPage } from '../features/map/map-page';
import { NotFound, RootLayout } from './root-layout';

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MapPage,
});

const routeTree = rootRoute.addChildren([mapRoute]);

export const createAppRouter = () => createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
