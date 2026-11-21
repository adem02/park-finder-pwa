#!/usr/bin/env node
/**
 * Génère src/infrastructure/in-memory/reims-demo-parkings.json à partir d'un export GeoJSON
 * OpenStreetMap des parkings gratuits (dossier parkings-data/ du projet).
 *
 * Usage : npm run seed:demo -- [chemin/vers/export.geojson]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(
  process.argv[2] ?? resolve(here, '../../parkings-data/reims_parkings_gratuits_public_2026-07-30.geojson'),
);
const output = resolve(here, '../src/infrastructure/in-memory/reims-demo-parkings.json');

const SQUARE_METERS_PER_SPOT = 25;
const EARTH_RADIUS_METERS = 6_371_000;

const TYPE_LABELS = {
  surface: 'de surface',
  underground: 'souterrain',
  'multi-storey': 'à étages',
  street_side: 'en bord de rue',
  lane: 'en bord de rue',
};

/** Centroïde et aire (m²) d'un anneau [lng, lat], projection équirectangulaire locale. */
const ringCentroidAndArea = (ring) => {
  const lat0 = (ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length) * (Math.PI / 180);
  const toXY = ([lng, lat]) => [
    EARTH_RADIUS_METERS * (lng * Math.PI / 180) * Math.cos(lat0),
    EARTH_RADIUS_METERS * (lat * Math.PI / 180),
  ];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = toXY(ring[i]);
    const [x2, y2] = toXY(ring[i + 1]);
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-6) {
    const [lng, lat] = ring[0];
    return { latitude: lat, longitude: lng, area: 0 };
  }
  cx /= 6 * area;
  cy /= 6 * area;
  return {
    latitude: (cy / EARTH_RADIUS_METERS) * (180 / Math.PI),
    longitude: (cx / (EARTH_RADIUS_METERS * Math.cos(lat0))) * (180 / Math.PI),
    area: Math.abs(area),
  };
};

const locate = (geometry) => {
  if (geometry.type === 'Point') {
    const [lng, lat] = geometry.coordinates;
    return { latitude: lat, longitude: lng, area: 0 };
  }
  if (geometry.type === 'Polygon') return ringCentroidAndArea(geometry.coordinates[0]);
  if (geometry.type === 'MultiPolygon') return ringCentroidAndArea(geometry.coordinates[0][0]);
  throw new Error(`Géométrie non gérée : ${geometry.type}`);
};

const round = (value, decimals) => Number(value.toFixed(decimals));

const geojson = JSON.parse(readFileSync(input, 'utf8'));
let unnamed = 0;

const parkings = geojson.features.map((feature) => {
  const props = feature.properties;
  const { latitude, longitude, area } = locate(feature.geometry);
  const capacity = Number.parseInt(props.capacity ?? '', 10);
  const estimated = Math.round(area / SQUARE_METERS_PER_SPOT);
  const totalSpots = Number.isFinite(capacity) && capacity > 0
    ? capacity
    : Math.min(500, Math.max(5, estimated || 10));
  const label = TYPE_LABELS[props.parking] ? ` ${TYPE_LABELS[props.parking]}` : '';
  const name = props.name?.trim() || `Parking${label} n°${(unnamed += 1)}`;

  return {
    id: `osm-${props['@id'].replace('/', '-')}`,
    name,
    totalSpots,
    latitude: round(latitude, 6),
    longitude: round(longitude, 6),
  };
});

writeFileSync(output, `${JSON.stringify(parkings, null, 2)}\n`);
console.log(`${parkings.length} parkings écrits dans ${output}`);
