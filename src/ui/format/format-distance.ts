const kilometers = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** 340 m, 1,2 km, 12 km. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  return `${kilometers.format(meters / 1000)} km`;
}
