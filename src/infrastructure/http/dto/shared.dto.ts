import { z } from 'zod';

/** Briques communes aux réponses de park-finder-api. */
export const coordinatesDtoSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const availabilityDtoSchema = z.object({
  availableSpots: z.number().int().nonnegative().nullable(),
  reportedAt: z.string().nullable(),
  isRecent: z.boolean(),
});

export const authorDtoSchema = z.object({
  id: z.string(),
  username: z.string(),
  photoUrl: z.string().nullish(),
});

export const commentDtoSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: authorDtoSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
});

export type AvailabilityDto = z.infer<typeof availabilityDtoSchema>;
export type AuthorDto = z.infer<typeof authorDtoSchema>;
export type CommentDto = z.infer<typeof commentDtoSchema>;
