import { InvalidResponseError, type GatewayError } from '@application/errors/gateway.errors';
import type { NearbyQuery, ParkingGateway } from '@application/ports/parking.gateway';
import type { PreparedPhoto } from '@application/ports/photo-processor.port';
import type { SpotCount } from '@domain/availability/spot-count';
import type { NewParking } from '@domain/parking/new-parking';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import { err, ok, type Result } from '@domain/shared/result';
import { addParkingResponseDtoSchema } from './dto/add-parking.dto';
import { findNearbyParkingsResponseDtoSchema } from './dto/find-nearby-parkings.dto';
import { parkingDetailsDtoSchema } from './dto/parking-details.dto';
import { Endpoints } from './endpoints';
import type { FetchHttpClient } from './fetch-http-client';
import { ParkingDetailsMapper } from './mappers/parking-details.mapper';
import { ParkingSummaryMapper } from './mappers/parking-summary.mapper';

/** Jusqu'à 3 photos d'environ 300 Ko sur une 4G faible : on laisse une minute. */
const UPLOAD_TIMEOUT_MS = 60_000;

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

  async add(
    parking: NewParking,
    photos: readonly PreparedPhoto[],
  ): Promise<Result<ParkingId, GatewayError>> {
    // Format attendu par NewParkingInputDto : champs texte, coordonnées en JSON, fichiers sous `photos`.
    const form = new FormData();
    form.append('name', parking.name);
    form.append('totalSpots', String(parking.totalSpots));
    form.append('coordinates', JSON.stringify(parking.coordinates.toSnapshot()));
    for (const photo of photos) form.append('photos', photo.blob, photo.fileName);

    const response = await this.http.postForm(Endpoints.parkings.add, form, {
      timeoutMs: UPLOAD_TIMEOUT_MS,
    });
    if (!response.ok) return response;

    const parsed = addParkingResponseDtoSchema.safeParse(response.value);
    if (!parsed.success) return err(new InvalidResponseError(parsed.error.message));
    return ok(parsed.data.id);
  }

  async delete(id: ParkingId): Promise<Result<void, GatewayError>> {
    const response = await this.http.delete(Endpoints.parkings.details(id));
    return response.ok ? ok(undefined) : response;
  }
}
