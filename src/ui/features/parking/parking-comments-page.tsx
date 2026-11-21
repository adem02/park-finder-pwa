import { useState } from 'react';
import { COMMENT_MAX_LENGTH } from '@domain/comment/comment-content';
import type { ParkingId } from '@domain/parking/parking-summary';
import { BackButton } from '../../components/back-button';
import { Button } from '../../components/button';
import { useToast } from '../../components/toast';
import { useNow } from '../../hooks/use-now';
import { CommentItem } from './comment-item';
import { parkingErrorMessage } from './messages';
import { useParkingComments, usePostComment } from './use-parking-comments';
import { useParkingDetails } from './use-parking-details';
import styles from './comments.module.css';

export function ParkingCommentsPage({ parkingId }: { parkingId: ParkingId }) {
  const details = useParkingDetails(parkingId);
  const comments = useParkingComments(parkingId);
  const now = useNow();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BackButton variant="plain" />
        <h1 className={styles.title}>
          Commentaires{details.data ? ` · ${details.data.name}` : ''}
        </h1>
      </header>

      <div className={styles.content}>
        {comments.isPending && <p className={styles.empty}>Chargement des commentaires…</p>}
        {comments.isError && (
          <p className={styles.error} role="alert">
            {parkingErrorMessage(comments.error)}
          </p>
        )}
        {comments.data?.length === 0 && (
          <p className={styles.empty}>Aucun commentaire. Soyez le premier à aider la communauté.</p>
        )}
        {comments.data && comments.data.length > 0 && (
          <ul className={styles.list}>
            {comments.data.map((comment) => (
              <CommentItem key={comment.id} comment={comment} now={now} />
            ))}
          </ul>
        )}
        {comments.hasNextPage && (
          <Button
            variant="ghost"
            loading={comments.isFetchingNextPage}
            onClick={() => void comments.fetchNextPage()}
          >
            Voir plus
          </Button>
        )}
      </div>

      <CommentComposer parkingId={parkingId} />
    </main>
  );
}

function CommentComposer({ parkingId }: { parkingId: ParkingId }) {
  const [content, setContent] = useState('');
  const post = usePostComment(parkingId);
  const showToast = useToast();
  const length = content.trim().length;
  const isOver = length > COMMENT_MAX_LENGTH;

  return (
    <form
      className={styles.composer}
      onSubmit={(event) => {
        event.preventDefault();
        post.mutate(content, {
          onSuccess: () => {
            setContent('');
            showToast('Commentaire publié.');
          },
        });
      }}
    >
      <div className={styles.composerRow}>
        <textarea
          id="comment-content"
          className={styles.textarea}
          aria-label="Votre commentaire"
          placeholder="Partagez une info utile (accès, affluence…)"
          rows={1}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <Button type="submit" loading={post.isPending} disabled={length === 0 || isOver}>
          Publier
        </Button>
      </div>
      {post.isError && (
        <p className={styles.error} role="alert">
          {parkingErrorMessage(post.error)}
        </p>
      )}
      {length > COMMENT_MAX_LENGTH - 100 && (
        <p className={`${styles.counter} ${isOver ? styles.counterOver : ''}`}>
          {length} / {COMMENT_MAX_LENGTH}
        </p>
      )}
    </form>
  );
}
