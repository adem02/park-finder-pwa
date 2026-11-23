import {
  MapLibreMap,
  Marker,
  setWorkerUrl,
  type GeoJSONSource,
  type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import type { CoordinatesSnapshot } from '@domain/geo/coordinates';
import type { ParkingId } from '@domain/parking/parking-summary';
import {
  DEFAULT_ZOOM,
  FOCUS_ZOOM,
  MAP_STYLE_URL,
  PARKING_PINS_LAYER_ID,
  PARKINGS_SOURCE_ID,
  parkingPinsLayer,
} from './map-style';
import type { ParkingPinCollection } from './parking-feature.presenter';
import styles from './map-view.module.css';

// MapLibre 6 charge son worker depuis un fichier séparé : on lui donne l'URL émise par Vite.
setWorkerUrl(maplibreWorkerUrl);

export interface MapViewHandle {
  flyTo(center: CoordinatesSnapshot): void;
}

interface MapViewProps {
  ref?: Ref<MapViewHandle>;
  initialCenter: CoordinatesSnapshot;
  pins: ParkingPinCollection;
  userPosition: CoordinatesSnapshot | null;
  onMoveEnd: (center: CoordinatesSnapshot) => void;
  onPinSelect: (id: ParkingId | null) => void;
}

/** Seul composant qui connaît MapLibre. Le reste de l'UI lui passe du GeoJSON. */
export function MapView({
  ref,
  initialCenter,
  pins,
  userPosition,
  onMoveEnd,
  onPinSelect,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);

  const handleMoveEnd = useEffectEvent((center: CoordinatesSnapshot) => onMoveEnd(center));
  const handlePinSelect = useEffectEvent((id: ParkingId | null) => onPinSelect(id));
  const readInitialPins = useEffectEvent(() => pins);

  // Création de la carte, une seule fois.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = new MapLibreMap({
      container,
      style: MAP_STYLE_URL,
      center: [initialCenter.longitude, initialCenter.latitude],
      zoom: DEFAULT_ZOOM,
      // Les parkings importés viennent d'OpenStreetMap (ODbL) : crédit obligatoire, à côté du fond de carte.
      attributionControl: {
        compact: true,
        customAttribution: 'Parkings © contributeurs OpenStreetMap',
      },
    });

    instance.on('load', () => {
      instance.addSource(PARKINGS_SOURCE_ID, { type: 'geojson', data: readInitialPins() });
      instance.addLayer(parkingPinsLayer);
      setMap(instance);
    });

    instance.on('moveend', () => {
      const { lat, lng } = instance.getCenter();
      handleMoveEnd({ latitude: lat, longitude: lng });
    });

    instance.on('click', (event: MapMouseEvent) => {
      const [feature] = instance.queryRenderedFeatures(event.point, {
        layers: [PARKING_PINS_LAYER_ID],
      });
      const id: unknown = feature?.properties.id;
      handlePinSelect(typeof id === 'string' ? id : null);
    });

    instance.on('mouseenter', PARKING_PINS_LAYER_ID, () => {
      instance.getCanvas().style.cursor = 'pointer';
    });
    instance.on('mouseleave', PARKING_PINS_LAYER_ID, () => {
      instance.getCanvas().style.cursor = '';
    });

    return () => {
      setMap(null);
      instance.remove();
    };
    // La carte est créée une fois ; le centre initial ne doit pas la recréer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour des pins.
  useEffect(() => {
    void map?.getSource<GeoJSONSource>(PARKINGS_SOURCE_ID)?.setData(pins);
  }, [map, pins]);

  // Point bleu de l'utilisateur.
  useEffect(() => {
    if (!map) return;
    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const lngLat: [number, number] = [userPosition.longitude, userPosition.latitude];
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(lngLat);
    } else {
      const element = document.createElement('div');
      element.className = styles.userDot ?? '';
      userMarkerRef.current = new Marker({ element }).setLngLat(lngLat).addTo(map);
    }
  }, [map, userPosition]);

  useImperativeHandle(
    ref,
    () => ({
      flyTo(center) {
        map?.flyTo({ center: [center.longitude, center.latitude], zoom: FOCUS_ZOOM });
      },
    }),
    [map],
  );

  return <div ref={containerRef} className={styles.map} role="region" aria-label="Carte des parkings" />;
}
