import { z } from 'zod';

/** Réponse de POST /parkings/new (AddNewParkingUseCaseResponse). */
export const addParkingResponseDtoSchema = z.object({
  id: z.string().min(1),
});
