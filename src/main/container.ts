import { Login } from '@application/auth/login.use-case';
import { DeleteAccount } from '@application/auth/delete-account.use-case';
import { Logout } from '@application/auth/logout.use-case';
import { Register } from '@application/auth/register.use-case';
import { RestoreSession } from '@application/auth/restore-session.use-case';
import { AddParking } from '@application/parking/add-parking.use-case';
import { AddParkingPhotos } from '@application/parking/add-parking-photos.use-case';
import { DeleteParking } from '@application/parking/delete-parking.use-case';
import { RemoveParkingPhoto } from '@application/parking/remove-parking-photo.use-case';
import { PreparePhoto } from '@application/parking/prepare-photo.use-case';
import { GetLeaderboard } from '@application/profile/get-leaderboard.use-case';
import { GetMyProfile } from '@application/profile/get-my-profile.use-case';
import { ReportAvailability } from '@application/availability/report-availability.use-case';
import { ListParkingComments } from '@application/comment/list-parking-comments.use-case';
import { PostComment } from '@application/comment/post-comment.use-case';
import { LocateUser } from '@application/location/locate-user.use-case';
import { GetDirections } from '@application/navigation/get-directions.use-case';
import { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import { GetParkingDetails } from '@application/parking/get-parking-details.use-case';
import type { AuthGateway } from '@application/ports/auth.gateway';
import type { CommentGateway } from '@application/ports/comment.gateway';
import type { GeolocationPort } from '@application/ports/geolocation.port';
import type { ParkingGateway } from '@application/ports/parking.gateway';
import type { ProfileGateway } from '@application/ports/profile.gateway';
import type { SessionExpiryPort } from '@application/ports/session-expiry.port';
import type { VoteGateway } from '@application/ports/vote.gateway';
import { ToggleVote } from '@application/vote/toggle-vote.use-case';
import { BrowserGeolocation } from '@infrastructure/browser/browser-geolocation';
import { CanvasPhotoProcessor } from '@infrastructure/browser/canvas-photo-processor';
import { UniversalDirections } from '@infrastructure/browser/universal-directions';
import { HttpAuthGateway } from '@infrastructure/http/http-auth.gateway';
import { HttpSession } from '@infrastructure/http/http-session';
import { HttpCommentGateway } from '@infrastructure/http/http-comment.gateway';
import { HttpParkingGateway } from '@infrastructure/http/http-parking.gateway';
import { HttpProfileGateway } from '@infrastructure/http/http-profile.gateway';
import { HttpVoteGateway } from '@infrastructure/http/http-vote.gateway';
import { FakeGeolocation } from '@infrastructure/in-memory/fake-geolocation';
import {
  DEMO_ACCOUNT,
  InMemoryAuthGateway,
  neverExpires,
} from '@infrastructure/in-memory/in-memory-auth.gateway';
import { InMemoryCommentGateway } from '@infrastructure/in-memory/in-memory-comment.gateway';
import { InMemoryParkingGateway } from '@infrastructure/in-memory/in-memory-parking.gateway';
import { InMemoryProfileGateway } from '@infrastructure/in-memory/in-memory-profile.gateway';
import { InMemoryVoteGateway } from '@infrastructure/in-memory/in-memory-vote.gateway';
import {
  REIMS_DEMO_POSITION,
  createReimsDemoStore,
} from '@infrastructure/in-memory/reims-demo-parkings';
import { SystemClock } from '@infrastructure/time/system-clock';
import type { AppContainer } from '@ui/app/app-container';
import type { Env } from './env';

interface Gateways {
  readonly auth: AuthGateway;
  readonly sessionExpiry: SessionExpiryPort;
  readonly parkings: ParkingGateway;
  readonly profiles: ProfileGateway;
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
    const session = new HttpSession({ baseUrl: env.apiUrl });
    const { http } = session;
    gateways = {
      auth: new HttpAuthGateway(session),
      sessionExpiry: session.expiry,
      parkings: new HttpParkingGateway(http),
      profiles: new HttpProfileGateway(http),
      votes: new HttpVoteGateway(http),
      comments: new HttpCommentGateway(http),
      geolocation: new BrowserGeolocation(),
    };
  } else {
    const store = createReimsDemoStore(clock.now());
    gateways = {
      auth: new InMemoryAuthGateway(),
      sessionExpiry: neverExpires,
      parkings: new InMemoryParkingGateway(store, clock),
      profiles: new InMemoryProfileGateway(store, clock, DEMO_ACCOUNT.email),
      votes: new InMemoryVoteGateway(store),
      comments: new InMemoryCommentGateway(store, clock),
      geolocation: FakeGeolocation.at(REIMS_DEMO_POSITION),
    };
  }

  return {
    clock,
    dataSource: env.dataSource,
    sessionExpiry: gateways.sessionExpiry,
    demoAccount: env.dataSource === 'demo' ? DEMO_ACCOUNT : undefined,
    googleSignInUrl:
      env.dataSource === 'api' ? new URL('/auth/google', env.apiUrl).toString() : undefined,
    useCases: {
      login: new Login(gateways.auth),
      register: new Register(gateways.auth),
      restoreSession: new RestoreSession(gateways.auth),
      logout: new Logout(gateways.auth),
      deleteAccount: new DeleteAccount(gateways.auth),
      findNearbyParkings: new FindNearbyParkings(gateways.parkings),
      getParkingDetails: new GetParkingDetails(gateways.parkings),
      addParking: new AddParking(gateways.parkings),
      deleteParking: new DeleteParking(gateways.parkings),
      addParkingPhotos: new AddParkingPhotos(gateways.parkings),
      removeParkingPhoto: new RemoveParkingPhoto(gateways.parkings),
      getMyProfile: new GetMyProfile(gateways.profiles),
      getLeaderboard: new GetLeaderboard(gateways.profiles, clock),
      preparePhoto: new PreparePhoto(new CanvasPhotoProcessor()),
      reportAvailability: new ReportAvailability(gateways.parkings, clock),
      toggleVote: new ToggleVote(gateways.votes),
      listParkingComments: new ListParkingComments(gateways.comments),
      postComment: new PostComment(gateways.comments),
      getDirections: new GetDirections(new UniversalDirections()),
      locateUser: new LocateUser(gateways.geolocation),
    },
  };
}
