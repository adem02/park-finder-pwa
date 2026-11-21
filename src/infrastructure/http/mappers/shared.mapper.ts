import { Availability } from '@domain/availability/availability';
import { Comment } from '@domain/comment/comment';
import { Author } from '@domain/user/author';
import type { AuthorDto, AvailabilityDto, CommentDto } from '../dto/shared.dto';

export class SharedMapper {
  static toAvailability({ availableSpots, reportedAt }: AvailabilityDto): Availability {
    return availableSpots === null || reportedAt === null
      ? Availability.none()
      : Availability.reported(availableSpots, new Date(reportedAt));
  }

  static toAuthor(dto: AuthorDto): Author {
    return Author.fromSnapshot({ id: dto.id, username: dto.username, photoUrl: dto.photoUrl ?? null });
  }

  static toComment(dto: CommentDto): Comment {
    return Comment.create({
      id: dto.id,
      content: dto.content,
      author: SharedMapper.toAuthor(dto.author),
      createdAt: new Date(dto.createdAt),
    });
  }
}
