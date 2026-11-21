import type { Author } from '@domain/user/author';
import styles from './avatar.module.css';

export function Avatar({ author, size = 32 }: { author: Author; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };

  return author.photoUrl ? (
    <img className={styles.avatar} src={author.photoUrl} alt="" style={style} />
  ) : (
    <span className={styles.avatar} style={style} aria-hidden="true">
      {author.initial}
    </span>
  );
}
