import { describe, expect, it } from 'vitest';
import { safeRedirect } from '@ui/features/auth/redirect-search';

describe('safeRedirect', () => {
  it('garde un chemin interne, avec ses paramètres', () => {
    expect(safeRedirect('/list?radius=5000')).toBe('/list?radius=5000');
  });

  it('refuse tout ce qui pourrait sortir de l’app', () => {
    expect(safeRedirect('https://evil.example')).toBeUndefined();
    expect(safeRedirect('//evil.example')).toBeUndefined();
    expect(safeRedirect('/\\evil.example')).toBeUndefined();
    expect(safeRedirect(42)).toBeUndefined();
  });
});
