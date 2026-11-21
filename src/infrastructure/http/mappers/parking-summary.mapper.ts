import { InvalidResponseError } from '@application/errors/gateway.errors';
import { Availability } from '@domain/availability/availability';
import { Coordinates } from '@domain/geo/coordinates';
import { ParkingSummary } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { ParkingScore } from '@domain/vote/parking-score';
import type { ParkingItemDto } from '../dto/find-nearby-parkings.dto';

export class ParkingSummaryMapper {
  static toDomain(dto: ParkingItemDto): Result<ParkingSummary, InvalidResponseError> {
    const coordinates = Coordinates.create(dto.coordinates.latitude, dto.coordinates.longitude);
    if (!coordinates.ok) {
      return err(new InvalidResponseError(`coordonnées invalides pour le parking ${dto.id}`));
    }

    return ok(
      ParkingSummary.create({
        id: dto.id,
        name: dto.name,
        totalSpots: dto.totalSpots,
        photos: dto.photos,
        coordinates: coordinates.value,
        distanceMeters: dto.distanceMeters,
        availability: ParkingSummaryMapper.toAvailability(dto.availability),
        score: ParkingScore.of(dto.votes.upvotes, dto.votes.downvotes),
        createdAt: new Date(dto.createdAt),
      }),
    );
  }

  private static toAvailability({
    availableSpots,
    reportedAt,
  }: ParkingItemDto['availability']): Availability {
    return availableSpots === null || reportedAt === null
      ? Availability.none()
      : Availability.reported(availableSpots, new Date(reportedAt));
  }
}
