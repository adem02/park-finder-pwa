import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useUseCases } from '../../app/container-context';
import { parkingKeys, profileKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

/** Retire le parking : il disparaît de la carte, de la liste et du profil (points repris). */
export function useDeleteParking() {
  const { deleteParking } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: ParkingId) => unwrap(deleteParking.execute(id)),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: parkingKeys.detail(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: parkingKeys.nearbyAll() }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
    },
  });
}
