import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ParkingDetails, ParkingDetailsSnapshot } from '@domain/parking/parking-details';
import type { VoteType } from '@domain/vote/parking-votes';
import { useUseCases } from '../../app/container-context';
import { useToast } from '../../components/toast';
import { parkingKeys, profileKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

interface ToggleVoteVariables {
  parking: ParkingDetails;
  type: VoteType;
}

/** Vote optimiste : l'écran change tout de suite, et revient en arrière si le serveur refuse. */
export function useToggleVote() {
  const { toggleVote } = useUseCases();
  const queryClient = useQueryClient();
  const showToast = useToast();

  return useMutation({
    mutationFn: ({ parking, type }: ToggleVoteVariables) =>
      unwrap(toggleVote.execute({ parking, type })),

    onMutate: async ({ parking, type }) => {
      const key = parkingKeys.detail(parking.id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ParkingDetailsSnapshot>(key);
      queryClient.setQueryData(
        key,
        parking.withVotes(toggleVote.preview(parking, type)).toSnapshot(),
      );
      return { previous };
    },

    onError: (_error, { parking }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(parkingKeys.detail(parking.id), context.previous);
      }
      showToast('Votre vote n’a pas pu être enregistré. Réessayez.', 'error');
    },

    onSettled: (_votes, _error, { parking }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: parkingKeys.detail(parking.id) }),
        queryClient.invalidateQueries({ queryKey: parkingKeys.nearbyAll() }),
        // Un vote rapporte 1 point : le profil et le classement changent.
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]),
  });
}
