import { z } from 'zod';
import { availabilityDtoSchema, coordinatesDtoSchema } from './shared.dto';

/** Format de GET /parkings (FindNearbyParkingsOutputDto côté API). Ne sort jamais d'infrastructure/. */
export const parkingItemDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalSpots: z.number().int().nonnegative(),
  photos: z.array(z.string()),
  coordinates: coordinatesDtoSchema,
  distanceMeters: z.number().nonnegative(),
  availability: availabilityDtoSchema,
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
