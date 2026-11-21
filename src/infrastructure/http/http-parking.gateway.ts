import { InvalidResponseError, type GatewayError } from '@application/errors/gateway.errors';
import type { NearbyQuery, ParkingGateway } from '@application/ports/parking.gateway';
import type { SpotCount } from '@domain/availability/spot-count';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { findNearbyParkingsResponseDtoSchema } from './dto/find-nearby-parkings.dto';
import { parkingDetailsDtoSchema } from './dto/parking-details.dto';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';
import { ParkingDetailsMapper } from './mappers/parking-details.mapper';
import { ParkingSummaryMapper } from './mappers/parking-summary.mapper';

export class HttpParkingGateway implements ParkingGateway {
  constructor(private readonly http: FetchHttpClient) {}

  async findNearby(
    { center, filters }: NearbyQuery,
    signal?: AbortSignal,
  ): Promise<Result<ParkingSummary[], GatewayError>> {
    const response = await this.http.getJson(Endpoints.parkings.nearby, {
      query: {
        lat: center.latitude,
        lng: center.longitude,
        radius: filters.radius.meters,
        // Critères par défaut omis : l'URL reste courte et l'API applique les mêmes défauts.
        minSpots: filters.minSpots > 0 ? filters.minSpots : undefined,
        availableOnly: filters.availableOnly || undefined,
        verifiedOnly: filters.verifiedOnly || undefined,
        sort: filters.sort,
      },
      signal,
    });
    if (!response.ok) return response;

    const parsed = findNearbyParkingsResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));

    const parkings: ParkingSummary[] = [];
    for (const dto of parsed.data.parkings) {
      const parking = ParkingSummaryMapper.toDomain(dto);
      if (!parking.ok) return parking;
      parkings.push(parking.value);
    }
    return ok(parkings);
  }

  async getDetails(
    id: ParkingId,
    signal?: AbortSignal,
  ): Promise<Result<ParkingDetails, GatewayError>> {
    const response = await this.http.getJson(Endpoints.parkings.details(id), { signal });
    if (!response.ok) return response;

    const parsed = parkingDetailsDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));

    return ParkingDetailsMapper.toDomain(parsed.data);
  }

  async reportAvailability(id: ParkingId, spots: SpotCount): Promise<Result<void, GatewayError>> {
    const response = await this.http.postJson(Endpoints.parkings.report(id), {
      availableSpots: spots.value,
    });
    return response.ok ? ok(undefined) : response;
  }
}
