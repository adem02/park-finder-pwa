import { ReportAvailability } from '@application/availability/report-availability.use-case';
import { ListParkingComments } from '@application/comment/list-parking-comments.use-case';
import { PostComment } from '@application/comment/post-comment.use-case';
import { LocateUser } from '@application/location/locate-user.use-case';
import { GetDirections } from '@application/navigation/get-directions.use-case';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import { GetParkingDetails } from '@application/parking/get-parking-details.use-case';
import type { CommentGateway } from '@application/ports/comment.gateway';
import type { GeolocationPort } from '@application/ports/geolocation.port';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import type { VoteGateway } from '@application/ports/vote.gateway';
import { ToggleVote } from '@application/vote/toggle-vote.use-case';
import { BrowserGeolocation } from '@infrastructure/browser/browser-geolocation';
import { UniversalDirections } from '@infrastructure/browser/universal-directions';
import { FetchHttpClient } from '@infrastructure/http/fetch-http-client';
import { HttpCommentGateway } from '@infrastructure/http/http-comment.gateway';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';
import { HttpVoteGateway } from '@infrastructure/http/http-vote.gateway';
import { FakeGeolocation } from '@infrastructure/in-memory/fake-geolocation';
import { InMemoryCommentGateway } from '@infrastructure/in-memory/in-memory-comment.gateway';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import { InMemoryVoteGateway } from '@infrastructure/in-memory/in-memory-vote.gateway';
import {
  REIMS_DEMO_POSITION,
  createReimsDemoStore,
} from '@infrastructure/in-memory/reims-demo-parkings';
import { SystemClock } from '@infrastructure/time/system-clock';
import type { AppContainer } from '@ui/app/app-container';
import type { Env } from './env';

interface Gateways {
  readonly parkings: ParkingGateway;
  readonly votes: VoteGateway;
  readonly comments: CommentGateway;
  readonly geolocation: GeolocationPort;
}

/**
 * Composition root : le seul endroit qui connaît les implémentations concrètes.
 * En démo, les parkings de Reims sont en mémoire et l'utilisateur est placé au centre de Reims.
 */
export function createContainer(env: Env): AppContainer {
  const clock = new SystemClock();

  let gateways: Gateways;
  if (env.dataSource === 'api') {
    const http = new FetchHttpClient({ baseUrl: env.apiUrl });
    gateways = {
      parkings: new HttpParkingGateway(http),
      votes: new HttpVoteGateway(http),
      comments: new HttpCommentGateway(http),
      geolocation: new BrowserGeolocation(),
    };
  } else {
    const store = createReimsDemoStore(clock.now());
    gateways = {
      parkings: new InMemoryParkingGateway(store, clock),
      votes: new InMemoryVoteGateway(store),
      comments: new InMemoryCommentGateway(store, clock),
      geolocation: FakeGeolocation.at(REIMS_DEMO_POSITION),
    };
  }

  return {
    clock,
    dataSource: env.dataSource,
    useCases: {
      findNearbyParkings: new FindNearbyParkings(gateways.parkings),
      getParkingDetails: new GetParkingDetails(gateways.parkings),
      reportAvailability: new ReportAvailability(gateways.parkings, clock),
      toggleVote: new ToggleVote(gateways.votes),
      listParkingComments: new ListParkingComments(gateways.comments),
      postComment: new PostComment(gateways.comments),
      getDirections: new GetDirections(new UniversalDirections()),
      locateUser: new LocateUser(gateways.geolocation),
    },
  };
}
