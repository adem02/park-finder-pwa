import styles from './avatar.module.css';

/** Tout utilisateur affichable : auteur d'un contenu ou utilisateur connecté. */
interface AvatarPerson {
  readonly photoUrl: string | null;
  readonly initial: string;
}

export function Avatar({ author, size = 32 }: { author: AvatarPerson; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };

  return author.photoUrl ? (
    <img className={styles.avatar} src={author.photoUrl} alt="" style={style} />
  ) : (
    <span className={styles.avatar} style={style} aria-hidden="true">
      {author.initial}
    </span>
  );
}
