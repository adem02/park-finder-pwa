export const parkingKeys = {
  all: ['parkings'] as const,
  nearbyAll: () => [...parkingKeys.all, 'nearby'] as const,
  nearby: (latitude: number, longitude: number, radiusMeters: number | undefined) =>
    [...parkingKeys.nearbyAll(), { latitude, longitude, radiusMeters }] as const,
  detail: (id: string) => [...parkingKeys.all, 'detail', id] as const,
  comments: (id: string) => [...parkingKeys.all, 'comments', id] as const,
};

export const locationKeys = {
  current: ['location', 'current'] as const,
};
