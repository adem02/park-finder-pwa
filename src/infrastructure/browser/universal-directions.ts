import type { DirectionsLink, DirectionsPort } from '@application/ports/directions.port';
import type { Coordinates } from '@domain/geo/coordinates';

/**
 * Liens universels (https) : ils ouvrent l'appli si elle est installée, sinon le site.
 * Un navigateur ne peut pas savoir quelles applis sont installées, contrairement à React Native.
 * Plans d'Apple n'est proposé que sur iPhone, iPad et Mac.
 */
export class UniversalDirections implements DirectionsPort {
  constructor(private readonly userAgent: string = globalThis.navigator?.userAgent ?? '') {}

  linksTo(destination: Coordinates, label: string): DirectionsLink[] {
    const { latitude, longitude } = destination;
    const coords = `${latitude},${longitude}`;

    const links: DirectionsLink[] = [
      {
        app: 'google-maps',
        label: 'Google Maps',
        url: `https://www.google.com/maps/dir/?api=1&destination=${coords}&travelmode=driving`,
      },
      {
        app: 'waze',
        label: 'Waze',
        url: `https://waze.com/ul?ll=${coords}&navigate=yes`,
      },
    ];

    if (this.isApplePlatform()) {
      links.unshift({
        app: 'apple-plans',
        label: 'Plans',
        url: `https://maps.apple.com/?daddr=${coords}&q=${encodeURIComponent(label)}&dirflg=d`,
      });
    }

    return links;
  }

  private isApplePlatform(): boolean {
    return /iPhone|iPad|iPod|Macintosh/.test(this.userAgent);
  }
}
