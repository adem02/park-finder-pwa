import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AddParkingInput } from '@application/parking/add-parking.use-case';
import type { PhotoError, PreparedPhoto } from '@application/ports/photo-processor.port';
import { PARKING_MAX_PHOTOS } from '@domain/parking/new-parking';
import { useUseCases } from '../../app/container-context';
import { parkingKeys, profileKeys } from '../../query/query-keys';
import { unwrap } from '../../query/unwrap';

export function useAddParking() {
  const { addParking } = useUseCases();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddParkingInput) => unwrap(addParking.execute(input)),
    // Le nouveau parking doit apparaître sur la carte et dans la liste.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: parkingKeys.nearbyAll() }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]),
  });
}

export type DraftPhoto =
  | { readonly id: string; readonly status: 'processing'; readonly name: string }
  | {
      readonly id: string;
      readonly status: 'ready';
      readonly name: string;
      readonly photo: PreparedPhoto;
    }
  | {
      readonly id: string;
      readonly status: 'error';
      readonly name: string;
      readonly error: PhotoError;
    };

let nextId = 0;

/**
 * Photos en cours de préparation (redimensionnement) et prêtes. Les aperçus locaux sont libérés
 * au retrait d'une photo et en quittant l'écran, sauf après un envoi réussi (`keep`).
 */
export function usePhotoDraft() {
  const { preparePhoto } = useUseCases();
  const [items, setItems] = useState<readonly DraftPhoto[]>([]);
  // Lus par les callbacks et au démontage : `itemsRef` suit l'état après chaque rendu,
  // `countRef` est mis à jour tout de suite pour compter les places libres entre deux sélections rapides.
  const itemsRef = useRef(items);
  const countRef = useRef(0);
  const keptRef = useRef(false);
  const removedRef = useRef(new Set<string>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const add = useCallback(
    (files: readonly File[]) => {
      const slots = PARKING_MAX_PHOTOS - countRef.current;
      const accepted = files.slice(0, Math.max(0, slots));
      countRef.current += accepted.length;
      for (const file of accepted) {
        nextId += 1;
        const id = `photo-${nextId}`;
        setItems((current) => [...current, { id, status: 'processing', name: file.name }]);
        void preparePhoto.execute(file, file.name).then((result) => {
          // Retirée pendant sa préparation : on libère l'aperçu au lieu de l'afficher.
          if (removedRef.current.has(id)) {
            if (result.ok) preparePhoto.release(result.value);
            return;
          }
          setItems((current) =>
            current.map((item) =>
              item.id !== id
                ? item
                : result.ok
                  ? { id, status: 'ready', name: file.name, photo: result.value }
                  : { id, status: 'error', name: file.name, error: result.error },
            ),
          );
        });
      }
      return files.length - accepted.length;
    },
    [preparePhoto],
  );

  const remove = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((candidate) => candidate.id === id);
      if (item?.status === 'ready') preparePhoto.release(item.photo);
      removedRef.current.add(id);
      countRef.current = Math.max(0, countRef.current - 1);
      setItems((current) => current.filter((candidate) => candidate.id !== id));
    },
    [preparePhoto],
  );

  /** Après un envoi réussi : en démo, les aperçus servent de photos au nouveau parking. */
  const keep = useCallback(() => {
    keptRef.current = true;
  }, []);

  useEffect(
    () => () => {
      if (keptRef.current) return;
      for (const item of itemsRef.current)
        if (item.status === 'ready') preparePhoto.release(item.photo);
    },
    [preparePhoto],
  );

  const ready = items.flatMap((item) => (item.status === 'ready' ? [item.photo] : []));
  const isProcessing = items.some((item) => item.status === 'processing');
  const canAddMore = items.length < PARKING_MAX_PHOTOS;

  return { items, ready, isProcessing, canAddMore, add, remove, keep };
}
