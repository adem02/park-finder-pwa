import { lazy } from 'react';
import { loadMapView } from './load-map-view';

/** MapView chargée à la demande (voir load-map-view.ts). À rendre dans un <Suspense>. */
export const LazyMapView = lazy(() => loadMapView().then((module) => ({ default: module.MapView })));
