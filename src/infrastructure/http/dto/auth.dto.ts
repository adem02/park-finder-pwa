import { z } from 'zod';

/** `user` de LoginOutputDTO, RegisterOutputDTO et GetUserProfileOutputDTO (park-finder-api). */
export const sessionUserDtoSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  email: z.string().nullish(),
  photoUrl: z.string().nullish(),
});

export const authResponseDtoSchema = z.object({
  user: sessionUserDtoSchema,
  accessToken: z.string().min(1),
});

export const refreshResponseDtoSchema = z.object({
  accessToken: z.string().min(1),
});

/** GET /users/me : seul `user` sert à la session, le reste (stats, badges…) sert au profil. */
export const meResponseDtoSchema = z.object({
  user: sessionUserDtoSchema,
});

export type SessionUserDto = z.infer<typeof sessionUserDtoSchema>;
