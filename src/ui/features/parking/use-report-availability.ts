import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ParkingDetails } from '@domain/parking/parking-details';
import { useUseCases } from '../../app/container-context';
import { parkingKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

export function useReportAvailability() {
  const { reportAvailability } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ parking, spots }: { parking: ParkingDetails; spots: number }) =>
      unwrap(reportAvailability.execute({ parking, spots })),

    onSuccess: (updated) => {
      queryClient.setQueryData(parkingKeys.detail(updated.id), updated.toSnapshot());
      return queryClient.invalidateQueries({ queryKey: parkingKeys.nearbyAll() });
    },
  });
}
