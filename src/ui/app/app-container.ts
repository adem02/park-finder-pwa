import type { Login } from '@application/auth/login.use-case';
import type { Logout } from '@application/auth/logout.use-case';
import type { Register } from '@application/auth/register.use-case';
import type { RestoreSession } from '@application/auth/restore-session.use-case';
import type { ReportAvailability } from '@application/availability/report-availability.use-case';
import type { ListParkingComments } from '@application/comment/list-parking-comments.use-case';
import type { PostComment } from '@application/comment/post-comment.use-case';
import type { LocateUser } from '@application/location/locate-user.use-case';
import type { GetDirections } from '@application/navigation/get-directions.use-case';
import type { AddParking } from '@application/parking/add-parking.use-case';
import type { PreparePhoto } from '@application/parking/prepare-photo.use-case';
import type { GetLeaderboard } from '@application/profile/get-leaderboard.use-case';
import type { GetMyProfile } from '@application/profile/get-my-profile.use-case';
import type { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import type { GetParkingDetails } from '@application/parking/get-parking-details.use-case';
import type { Clock } from '@application/ports/clock.port';
import type { SessionExpiryPort } from '@application/ports/session-expiry.port';
import type { ToggleVote } from '@application/vote/toggle-vote.use-case';

/** Ce dont l'UI a besoin. main/ construit un objet conforme et le fournit via le contexte. */
export interface UseCases {
  readonly login: Login;
  readonly register: Register;
  readonly restoreSession: RestoreSession;
  readonly logout: Logout;
  readonly findNearbyParkings: FindNearbyParkings;
  readonly getParkingDetails: GetParkingDetails;
  readonly addParking: AddParking;
  readonly getMyProfile: GetMyProfile;
  readonly getLeaderboard: GetLeaderboard;
  readonly preparePhoto: PreparePhoto;
  readonly reportAvailability: ReportAvailability;
  readonly toggleVote: ToggleVote;
  readonly listParkingComments: ListParkingComments;
  readonly postComment: PostComment;
  readonly getDirections: GetDirections;
  readonly locateUser: LocateUser;
}

export interface AppContainer {
  readonly useCases: UseCases;
  readonly clock: Clock;
  readonly dataSource: 'demo' | 'api';
  readonly sessionExpiry: SessionExpiryPort;
  /** Identifiants affichés sur l'écran de connexion en mode démo. */
  readonly demoAccount?: { readonly email: string; readonly password: string };
}
