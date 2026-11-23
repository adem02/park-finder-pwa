import { describe, expect, it } from 'vitest';
import { CanonicalOrigin } from '@main/canonical-origin';

const at = (url: string) => {
  const { origin, pathname, search, hash } = new URL(url);
  return { origin, pathname, search, hash };
};

describe('CanonicalOrigin', () => {
  const canonical = new CanonicalOrigin('https://placegratos.fr');

  it('renvoie vers l’adresse publique en gardant le chemin, les filtres et l’ancre', () => {
    expect(
      canonical.redirectTarget(at('https://park-finder-39b69.web.app/parking/42?radius=5000#top')),
    ).toBe('https://placegratos.fr/parking/42?radius=5000#top');
  });

  it('ne fait rien sur l’adresse publique', () => {
    expect(canonical.redirectTarget(at('https://placegratos.fr/list'))).toBeNull();
  });

  it('ne fait rien sans adresse publique configurée (local)', () => {
    expect(new CanonicalOrigin(undefined).redirectTarget(at('http://localhost:5190/'))).toBeNull();
  });
});
