import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Leaderboard, type LeaderboardSnapshot } from '@domain/leaderboard/leaderboard';
import { UserProfile, type UserProfileSnapshot } from '@domain/user/user-profile';
import { useUseCases } from '../../app/container-context';
import { profileKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

const toProfile = (snapshot: UserProfileSnapshot) => UserProfile.fromSnapshot(snapshot);
const toLeaderboard = (snapshot: LeaderboardSnapshot) => Leaderboard.fromSnapshot(snapshot);

export function useMyProfile() {
  const { getMyProfile } = useUseCases();
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async ({ signal }) => (await unwrap(getMyProfile.execute(signal))).toSnapshot(),
    select: toProfile,
  });
}

export function useLeaderboard(month: string) {
  const { getLeaderboard } = useUseCases();
  return useQuery({
    queryKey: profileKeys.leaderboard(month),
    queryFn: async ({ signal }) => (await unwrap(getLeaderboard.execute(month, signal))).toSnapshot(),
    select: toLeaderboard,
    placeholderData: keepPreviousData,
  });
}
