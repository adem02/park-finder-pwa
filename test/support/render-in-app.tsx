import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ReportAvailability } from '@application/availability/report-availability.use-case';
import { ListParkingComments } from '@application/comment/list-parking-comments.use-case';
import { PostComment } from '@application/comment/post-comment.use-case';
import { LocateUser } from '@application/location/locate-user.use-case';
import { GetDirections } from '@application/navigation/get-directions.use-case';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import { GetParkingDetails } from '@application/parking/get-parking-details.use-case';
import { ToggleVote } from '@application/vote/toggle-vote.use-case';
import { UniversalDirections } from '@infrastructure/browser/universal-directions';
import { FakeGeolocation } from '@infrastructure/in-memory/fake-geolocation';
import { InMemoryCommentGateway } from '@infrastructure/in-memory/in-memory-comment.gateway';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import {
  InMemoryParkingStore,
  type DemoParkingRecord,
} from '@infrastructure/in-memory/in-memory-parking.store';
import { InMemoryVoteGateway } from '@infrastructure/in-memory/in-memory-vote.gateway';
import { FixedClock } from '@infrastructure/time/system-clock';
import type { AppContainer } from '@ui/app/app-container';
import { ContainerProvider } from '@ui/app/container-context';
import { ToastProvider } from '@ui/components/toast';
import { ERLON, NOW } from './parking.builder';

/** Container de test : vrais use cases, gateways en mémoire, heure figée. */
export function createTestContainer(records: readonly DemoParkingRecord[]) {
  const clock = new FixedClock(NOW);
  const store = new InMemoryParkingStore(records);
  const parkings = new InMemoryParkingGateway(store, clock);
  const comments = new InMemoryCommentGateway(store, clock);

  const container: AppContainer = {
    clock,
    dataSource: 'demo',
    useCases: {
      findNearbyParkings: new FindNearbyParkings(parkings),
      getParkingDetails: new GetParkingDetails(parkings),
      reportAvailability: new ReportAvailability(parkings, clock),
      toggleVote: new ToggleVote(new InMemoryVoteGateway(store)),
      listParkingComments: new ListParkingComments(comments),
      postComment: new PostComment(comments),
      getDirections: new GetDirections(new UniversalDirections('Linux')),
      locateUser: new LocateUser(FakeGeolocation.at(ERLON)),
    },
  };
  return { container, store, clock };
}

/** Rend un écran avec tout ce dont il a besoin : container, cache, toasts, routeur en mémoire. */
export function renderInApp(ui: ReactElement, container: AppContainer) {
  const rootRoute = createRootRoute({ component: Outlet });
  const screenRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => ui });
  const otherRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '$',
    component: () => <p>Autre page</p>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([screenRoute, otherRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const result = render(
    <ContainerProvider container={container}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ContainerProvider>,
  );
  return { ...result, router, queryClient };
}
