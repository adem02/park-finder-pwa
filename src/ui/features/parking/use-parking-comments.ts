import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Comment, type CommentSnapshot } from '@domain/comment/comment';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useUseCases } from '../../app/container-context';
import { parkingKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

interface CommentPageSnapshot {
  readonly items: readonly CommentSnapshot[];
  readonly nextCursor: string | null;
}

const toComments = (data: InfiniteData<CommentPageSnapshot, string | null>): Comment[] =>
  data.pages.flatMap((page) => page.items.map((item) => Comment.fromSnapshot(item)));

export function useParkingComments(parkingId: ParkingId) {
  const { listParkingComments } = useUseCases();

  return useInfiniteQuery({
    queryKey: parkingKeys.comments(parkingId),
    queryFn: async ({ pageParam, signal }): Promise<CommentPageSnapshot> => {
      const page = await unwrap(
        listParkingComments.execute({ parkingId, cursor: pageParam }, signal),
      );
      return {
        items: page.items.map((comment) => comment.toSnapshot()),
        nextCursor: page.nextCursor,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: toComments,
  });
}

export function usePostComment(parkingId: ParkingId) {
  const { postComment } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => unwrap(postComment.execute({ parkingId, content })),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: parkingKeys.comments(parkingId) }),
        queryClient.invalidateQueries({ queryKey: parkingKeys.detail(parkingId) }),
      ]),
  });
}
