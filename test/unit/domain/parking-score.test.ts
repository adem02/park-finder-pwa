import { describe, expect, it } from 'vitest';
import { ParkingScore } from '@domain/vote/parking-score';

describe('ParkingScore', () => {
  it('calcule le score net', () => {
    expect(ParkingScore.of(12, 3).net).toBe(9);
  });

  it('est vérifié au-delà de 10 (strictement)', () => {
    expect(ParkingScore.of(10, 0).isVerified()).toBe(false);
    expect(ParkingScore.of(11, 0).isVerified()).toBe(true);
  });

  it('demande une modération à partir de -5', () => {
    expect(ParkingScore.of(0, 4).needsModeration()).toBe(false);
    expect(ParkingScore.of(0, 5).needsModeration()).toBe(true);
  });
});
