import { CurrentUser } from '@domain/user/current-user';
import type { SessionUserDto } from '../dto/auth.dto';

export class SessionUserMapper {
  static toDomain(dto: SessionUserDto): CurrentUser {
    return CurrentUser.fromSnapshot({
      id: dto.id,
      username: dto.username,
      email: dto.email ?? null,
      photoUrl: dto.photoUrl ?? null,
    });
  }
}
