import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PreparedPhoto } from '@application/ports/photo-processor.port';
import type { ParkingDetails } from '@domain/parking/parking-details';
import type { ParkingId } from '@domain/parking/parking-summary';
import { useUseCases } from '../../app/container-context';
import { parkingKeys, profileKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

/** Après un ajout ou un retrait : fiche, carte/liste (photo de couverture) et profil (points). */
function useRefreshAfterPhotoChange() {
  const queryClient = useQueryClient();
  return (parkingId: ParkingId) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: parkingKeys.detail(parkingId) }),
      queryClient.invalidateQueries({ queryKey: parkingKeys.nearbyAll() }),
      queryClient.invalidateQueries({ queryKey: profileKeys.all }),
    ]);
}

export function useAddParkingPhotos() {
  const { addParkingPhotos } = useUseCases();
  const refresh = useRefreshAfterPhotoChange();
  return useMutation({
    mutationFn: ({ parking, photos }: { parking: ParkingDetails; photos: readonly PreparedPhoto[] }) =>
      unwrap(addParkingPhotos.execute(parking, photos)),
    onSuccess: (_, { parking }) => refresh(parking.id),
  });
}

export function useRemoveParkingPhoto() {
  const { removeParkingPhoto } = useUseCases();
  const refresh = useRefreshAfterPhotoChange();
  return useMutation({
    mutationFn: ({ parkingId, photoId }: { parkingId: ParkingId; photoId: string }) =>
      unwrap(removeParkingPhoto.execute(parkingId, photoId)),
    onSuccess: (_, { parkingId }) => refresh(parkingId),
  });
}
