import { Leaderboard } from '@domain/leaderboard/leaderboard';
import { UserProfile } from '@domain/user/user-profile';
import type { LeaderboardDto, ProfileDto } from '../dto/profile.dto';

export class ProfileMapper {
  static toDomain(dto: ProfileDto): UserProfile {
    const { stats } = dto;
    return UserProfile.fromSnapshot({
      user: {
        id: dto.user.id,
        username: dto.user.username,
        email: dto.user.email ?? null,
        photoUrl: dto.user.photoUrl ?? null,
      },
      stats: {
        parkingsAdded: stats.parkingsAdded,
        reportsCount: stats.reportsCount,
        votesCount: stats.votesCount,
      },
      level: {
        points: stats.points,
        level: stats.level,
        nextLevelThreshold: stats.nextLevelThreshold,
        progressToNextLevel: stats.progressToNextLevel,
        pointsToNextLevel: stats.pointsToNextLevel,
      },
      badges: dto.badges,
      monthlyRank: dto.rank,
      recentParkings: dto.recentParkings,
    });
  }

  static leaderboardToDomain(dto: LeaderboardDto): Leaderboard {
    return Leaderboard.fromSnapshot({
      month: dto.month,
      entries: dto.entries.map((entry) => ({ ...entry, photoUrl: entry.photoUrl ?? null })),
      userRank: dto.userRank,
    });
  }
}
