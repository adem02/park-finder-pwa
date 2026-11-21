import type { ReportAvailability } from '@application/availability/report-availability.use-case';
import type { ListParkingComments } from '@application/comment/list-parking-comments.use-case';
import type { PostComment } from '@application/comment/post-comment.use-case';
import type { LocateUser } from '@application/location/locate-user.use-case';
import type { GetDirections } from '@application/navigation/get-directions.use-case';
import type { FindNearbyParkings } from '@application/parking/find-nearby-parkings.use-case';
import type { GetParkingDetails } from '@application/parking/get-parking-details.use-case';
import type { Clock } from '@application/ports/clock.port';
import type { ToggleVote } from '@application/vote/toggle-vote.use-case';

/** Ce dont l'UI a besoin. main/ construit un objet conforme et le fournit via le contexte. */
export interface UseCases {
  readonly findNearbyParkings: FindNearbyParkings;
  readonly getParkingDetails: GetParkingDetails;
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
}
