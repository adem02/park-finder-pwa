import { z } from 'zod';
import { sessionUserDtoSchema } from './auth.dto';

const rankDtoSchema = z.object({
  rank: z.number().int().positive(),
  percentile: z.string(),
  monthlyPoints: z.number().int().nonnegative(),
});

/** GET /users/me (GetUserProfileOutputDTO). */
export const profileDtoSchema = z.object({
  user: sessionUserDtoSchema,
  stats: z.object({
    parkingsAdded: z.number().int().nonnegative(),
    reportsCount: z.number().int().nonnegative(),
    votesCount: z.number().int().nonnegative(),
    points: z.number().int().nonnegative(),
    level: z.number().int().nonnegative(),
    nextLevelThreshold: z.number().int().nonnegative(),
    progressToNextLevel: z.number().int().nonnegative(),
    pointsToNextLevel: z.number().int().nonnegative(),
  }),
  badges: z.array(
    z.object({ id: z.string(), name: z.string(), description: z.string(), iconUrl: z.string() }),
  ),
  rank: rankDtoSchema.nullable(),
  recentParkings: z.array(
    z.object({ id: z.string(), name: z.string(), score: z.number().int(), votesCount: z.number().int() }),
  ),
});

/** GET /users/leaderboard (GetLeaderboardOutputDTO). */
export const leaderboardDtoSchema = z.object({
  month: z.string(),
  entries: z.array(
    z.object({
      rank: z.number().int().positive(),
      userId: z.string(),
      username: z.string(),
      photoUrl: z.string().nullish(),
      monthlyPoints: z.number().int().nonnegative(),
    }),
  ),
  userRank: rankDtoSchema.nullable(),
});

export type ProfileDto = z.infer<typeof profileDtoSchema>;
export type LeaderboardDto = z.infer<typeof leaderboardDtoSchema>;
