import { z } from 'zod';

/** Format de GET /parkings (FindNearbyParkingsOutputDto côté API). Ne sort jamais d'infrastructure/. */
export const parkingItemDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalSpots: z.number().int().nonnegative(),
  photos: z.array(z.string()),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  distanceMeters: z.number().nonnegative(),
  availability: z.object({
    availableSpots: z.number().int().nonnegative().nullable(),
    reportedAt: z.string().nullable(),
    isRecent: z.boolean(),
  }),
  votes: z.object({
    upvotes: z.number().int().nonnegative(),
    downvotes: z.number().int().nonnegative(),
    score: z.number().int(),
  }),
  verified: z.boolean(),
  createdAt: z.string(),
});

export const findNearbyParkingsResponseDtoSchema = z.object({
  parkings: z.array(parkingItemDtoSchema),
});

export type ParkingItemDto = z.infer<typeof parkingItemDtoSchema>;
