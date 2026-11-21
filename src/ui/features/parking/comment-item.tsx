import type { Comment } from '@domain/comment/comment';
import { Avatar } from '../../components/avatar';
import { formatTimeAgo } from '../../format/format-time-ago';
import styles from './comments.module.css';

export function CommentItem({ comment, now }: { comment: Comment; now: Date }) {
  return (
    <li className={styles.comment}>
      <Avatar author={comment.author} />
      <div className={styles.commentBody}>
        <p className={styles.commentMeta}>
          <strong>{comment.author.username}</strong>
          <span> · {formatTimeAgo(comment.createdAt, now)}</span>
        </p>
        <p className={styles.commentText}>{comment.content}</p>
      </div>
    </li>
  );
}
