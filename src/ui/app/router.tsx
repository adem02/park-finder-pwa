import { createRootRoute, createRoute, createRouter, useNavigate } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { ParkingFilters } from '@domain/search/parking-filters';
import { MapPage } from '../features/map/map-page';
import { ParkingCommentsPage } from '../features/parking/parking-comments-page';
import { ParkingDetailsPage } from '../features/parking/parking-details-page';
import {
  filtersFromSearch,
  toFiltersSearch,
  validateFiltersSearch,
} from '../features/search/filters-search';
import { ListPage } from '../features/search/list-page';
import { NotFound, RootLayout } from './root-layout';
import { TabsLayout } from './tabs-layout';

export const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

/** Carte et Liste partagent les filtres de l'URL (`?radius=5000&verified=true`). */
const tabsRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'tabs',
  validateSearch: validateFiltersSearch,
  component: TabsLayout,
});

/** Filtres lus dans l'URL ; les modifier remplace l'entrée d'historique (le retour quitte l'écran). */
function useUrlFilters(from: '/' | '/list') {
  const search = tabsRoute.useSearch();
  const navigate = useNavigate({ from });
  const filters = useMemo(() => filtersFromSearch(search), [search]);
  const setFilters = useCallback(
    (next: ParkingFilters) => void navigate({ search: toFiltersSearch(next), replace: true }),
    [navigate],
  );
  return { filters, setFilters };
}

const mapRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: '/',
  component: function MapRoute() {
    const { filters, setFilters } = useUrlFilters('/');
    return <MapPage filters={filters} onFiltersChange={setFilters} />;
  },
});

const listRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: '/list',
  component: function ListRoute() {
    const { filters, setFilters } = useUrlFilters('/list');
    return <ListPage filters={filters} onFiltersChange={setFilters} />;
  },
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

export const routeTree = rootRoute.addChildren([
  tabsRoute.addChildren([mapRoute, listRoute]),
  parkingRoute,
  parkingCommentsRoute,
]);

export const createAppRouter = () =>
  createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
