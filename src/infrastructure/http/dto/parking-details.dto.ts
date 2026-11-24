import { z } from 'zod';
import {
  authorDtoSchema,
  availabilityDtoSchema,
  commentDtoSchema,
  coordinatesDtoSchema,
} from './shared.dto';

/** Format de GET /parkings/:id (GetParkingDetailsOutputDTO côté API). */
export const parkingDetailsDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalSpots: z.number().int().nonnegative(),
  photos: z.array(z.string()),
  /** Mêmes photos avec leur id et leur auteur (absent des API antérieures au registre des photos). */
  photoItems: z.array(z.object({ id: z.string(), url: z.string(), isMine: z.boolean() })).optional(),
  coordinates: coordinatesDtoSchema,
  addedBy: authorDtoSchema,
  availability: availabilityDtoSchema,
  votes: z.object({
    upvotes: z.number().int().nonnegative(),
    downvotes: z.number().int().nonnegative(),
    userVote: z.enum(['UPVOTE', 'DOWNVOTE']).nullable(),
  }),
  recentComments: z.array(commentDtoSchema),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
});

export type ParkingDetailsDto = z.infer<typeof parkingDetailsDtoSchema>;
