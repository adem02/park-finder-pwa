import { InvalidResponseError } from '@application/errors/gateway.errors';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingDetails } from '@domain/parking/parking-details';
import { err, ok, type Result } from '@domain/shared/result';
import { ParkingVotes } from '@domain/vote/parking-votes';
import type { ParkingDetailsDto } from '../dto/parking-details.dto';
import { SharedMapper } from './shared.mapper';

export class ParkingDetailsMapper {
  static toDomain(dto: ParkingDetailsDto): Result<ParkingDetails, InvalidResponseError> {
    const coordinates = Coordinates.create(dto.coordinates.latitude, dto.coordinates.longitude);
    if (!coordinates.ok) {
      return err(new InvalidResponseError(`coordonnées invalides pour le parking ${dto.id}`));
    }

    return ok(
      ParkingDetails.create({
        id: dto.id,
        name: dto.name,
        totalSpots: dto.totalSpots,
        photos: dto.photoItems ?? dto.photos.map((url) => ({ id: url, url, isMine: false })),
        coordinates: coordinates.value,
        addedBy: SharedMapper.toAuthor(dto.addedBy),
        availability: SharedMapper.toAvailability(dto.availability),
        votes: ParkingVotes.of(dto.votes.upvotes, dto.votes.downvotes, dto.votes.userVote),
        recentComments: dto.recentComments.map((comment) => SharedMapper.toComment(comment)),
        createdAt: new Date(dto.createdAt),
      }),
    );
  }
}
