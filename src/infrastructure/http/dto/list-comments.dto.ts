import { z } from 'zod';
import { commentDtoSchema } from './shared.dto';

/** Format de GET /parkings/:id/comments (ListParkingCommentsOutputDTO côté API). */
export const listCommentsResponseDtoSchema = z.object({
  items: z.array(commentDtoSchema),
  nextCursor: z.string().nullable(),
});
