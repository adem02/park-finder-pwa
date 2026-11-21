import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { ParkingFilters } from '@domain/search/parking-filters';
import type { CurrentUser } from '@domain/user/current-user';
import { AddParkingPage } from '../features/add-parking/add-parking-page';
import { LoginPage } from '../features/auth/login-page';
import { validateRedirectSearch } from '../features/auth/redirect-search';
import { RegisterPage } from '../features/auth/register-page';
import { MapPage } from '../features/map/map-page';
import { OnboardingProgress } from '../features/onboarding/onboarding-progress';
import { WelcomePage } from '../features/onboarding/welcome-page';
import { ParkingCommentsPage } from '../features/parking/parking-comments-page';
import { ParkingDetailsPage } from '../features/parking/parking-details-page';
import { LeaderboardPage } from '../features/profile/leaderboard-page';
import { ProfilePage } from '../features/profile/profile-page';
import {
  filtersFromSearch,
  toFiltersSearch,
  validateFiltersSearch,
} from '../features/search/filters-search';
import { ListPage } from '../features/search/list-page';
import { NotFound, RootLayout } from './root-layout';
import { TabsLayout } from './tabs-layout';

/** Fourni par SessionGate ; les gardes des routes le lisent dans `beforeLoad`. */
export interface RouterContext {
  readonly session: CurrentUser | null;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
});

/* ---------- Écrans sans compte : onboarding, connexion, inscription ---------- */

/** Déjà connecté : on file vers la page demandée (`?redirect=`) ou la carte. */
const guestRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'guest',
  validateSearch: validateRedirectSearch,
  beforeLoad: ({ context, search }) => {
    if (context.session) throw redirect({ href: search.redirect ?? '/', replace: true });
  },
  component: Outlet,
});

const welcomeRoute = createRoute({
  getParentRoute: () => guestRoute,
  path: '/welcome',
  component: WelcomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => guestRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => guestRoute,
  path: '/register',
  component: RegisterPage,
});

/* ---------- Écrans de l'app : connexion obligatoire ---------- */

/** Sans session : onboarding la première fois, sinon connexion, puis retour à la page demandée. */
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: ({ context, location }) => {
    if (context.session) return { session: context.session };
    if (!OnboardingProgress.isDone()) throw redirect({ to: '/welcome', replace: true });
    throw redirect({ to: '/login', search: { redirect: location.href }, replace: true });
  },
  component: Outlet,
});

/** Carte, Liste et Profil partagent les filtres de l'URL (`?radius=5000&verified=true`). */
const tabsRoute = createRoute({
  getParentRoute: () => appRoute,
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

const profileRoute = createRoute({
  getParentRoute: () => tabsRoute,
  path: '/profile',
  component: function ProfileRoute() {
    const { session } = appRoute.useRouteContext();
    return <ProfilePage user={session} />;
  },
});

const leaderboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/leaderboard',
  component: function LeaderboardRoute() {
    const { session } = appRoute.useRouteContext();
    return <LeaderboardPage user={session} />;
  },
});

const addParkingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/add',
  component: AddParkingPage,
});

const parkingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/parking/$parkingId',
  component: function ParkingRoute() {
    const { parkingId } = parkingRoute.useParams();
    return <ParkingDetailsPage key={parkingId} parkingId={parkingId} />;
  },
});

const parkingCommentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/parking/$parkingId/comments',
  component: function ParkingCommentsRoute() {
    const { parkingId } = parkingCommentsRoute.useParams();
    return <ParkingCommentsPage parkingId={parkingId} />;
  },
});

export const routeTree = rootRoute.addChildren([
  guestRoute.addChildren([welcomeRoute, loginRoute, registerRoute]),
  appRoute.addChildren([
    tabsRoute.addChildren([mapRoute, listRoute, profileRoute]),
    addParkingRoute,
    leaderboardRoute,
    parkingRoute,
    parkingCommentsRoute,
  ]),
]);

export const createAppRouter = () =>
  createRouter({
    routeTree,
    context: { session: null },
    defaultPreload: 'intent',
    scrollRestoration: true,
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
