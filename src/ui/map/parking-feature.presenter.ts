import type { ParkingId, ParkingSummary } from '@domain/parking/parking-summary';
import type { PinState } from '@domain/parking/pin-state';

export type ParkingPinProperties = {
  id: ParkingId;
  pinState: PinState;
  selected: boolean;
};

export type ParkingPinFeature = {
  type: 'Feature';
  id: ParkingId;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: ParkingPinProperties;
};

export type ParkingPinCollection = {
  type: 'FeatureCollection';
  features: ParkingPinFeature[];
};

/** Transforme des parkings du domaine en GeoJSON pour MapLibre. Aucune règle métier ici. */
export class ParkingFeaturePresenter {
  static toFeatureCollection(
    parkings: readonly ParkingSummary[],
    now: Date,
    selectedId: ParkingId | null,
  ): ParkingPinCollection {
    return {
      type: 'FeatureCollection',
      features: parkings.map((parking) => ({
        type: 'Feature',
        id: parking.id,
        geometry: {
          type: 'Point',
          coordinates: [parking.coordinates.longitude, parking.coordinates.latitude],
        },
        properties: {
          id: parking.id,
          pinState: parking.pinState(now),
          selected: parking.id === selectedId,
        },
      })),
    };
  }
}
