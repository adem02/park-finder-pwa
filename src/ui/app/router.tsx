import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { MapPage } from '../features/map/map-page';
import { ParkingCommentsPage } from '../features/parking/parking-comments-page';
import { ParkingDetailsPage } from '../features/parking/parking-details-page';
import { NotFound, RootLayout } from './root-layout';

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MapPage,
});

const parkingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parking/$parkingId',
  component: function ParkingRoute() {
    const { parkingId } = parkingRoute.useParams();
    return <ParkingDetailsPage key={parkingId} parkingId={parkingId} />;
  },
});

const parkingCommentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parking/$parkingId/comments',
  component: function ParkingCommentsRoute() {
    const { parkingId } = parkingCommentsRoute.useParams();
    return <ParkingCommentsPage parkingId={parkingId} />;
  },
});

export const routeTree = rootRoute.addChildren([mapRoute, parkingRoute, parkingCommentsRoute]);

export const createAppRouter = () =>
  createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
