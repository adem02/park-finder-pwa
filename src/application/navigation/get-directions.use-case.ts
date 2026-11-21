import type { Coordinates } from '@domain/geo/coordinates';
import type { DirectionsLink, DirectionsPort } from '../ports/directions.port';

/** « Y aller » : liens d'itinéraire vers un parking (Google Maps, Waze, Plans). */
export class GetDirections {
  constructor(private readonly directions: DirectionsPort) {}

  execute(input: { destination: Coordinates; label: string }): DirectionsLink[] {
    return this.directions.linksTo(input.destination, input.label);
  }
}
