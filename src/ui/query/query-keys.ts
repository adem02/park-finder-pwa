import type { ParkingFiltersSnapshot } from '@domain/search/parking-filters';

export const parkingKeys = {
  all: ['parkings'] as const,
  nearbyAll: () => [...parkingKeys.all, 'nearby'] as const,
  nearby: (latitude: number, longitude: number, filters: ParkingFiltersSnapshot) =>
    [...parkingKeys.nearbyAll(), { latitude, longitude, ...filters }] as const,
  detail: (id: string) => [...parkingKeys.all, 'detail', id] as const,
  comments: (id: string) => [...parkingKeys.all, 'comments', id] as const,
};

export const locationKeys = {
  current: ['location', 'current'] as const,
};
