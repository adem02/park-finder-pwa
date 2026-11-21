export const parkingKeys = {
  all: ['parkings'] as const,
  nearby: (latitude: number, longitude: number, radiusMeters: number | undefined) =>
    [...parkingKeys.all, 'nearby', { latitude, longitude, radiusMeters }] as const,
};

export const locationKeys = {
  current: ['location', 'current'] as const,
};
