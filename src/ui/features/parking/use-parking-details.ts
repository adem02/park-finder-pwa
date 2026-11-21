import { useQuery } from '@tanstack/react-query';
import { ParkingDetails, type ParkingDetailsSnapshot } from '@domain/parking/parking-details';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useUseCases } from '../../app/container-context';
import { parkingKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

const toDetails = (snapshot: ParkingDetailsSnapshot): ParkingDetails =>
  ParkingDetails.fromSnapshot(snapshot);

export function useParkingDetails(id: ParkingId) {
  const { getParkingDetails } = useUseCases();

  return useQuery({
    queryKey: parkingKeys.detail(id),
    queryFn: async ({ signal }) => (await unwrap(getParkingDetails.execute(id, signal))).toSnapshot(),
    select: toDetails,
  });
}
