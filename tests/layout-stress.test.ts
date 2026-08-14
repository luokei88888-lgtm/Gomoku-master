import { describe, expect, it } from 'vitest';
import { computeBoardLayout, PLAY_FOOTER_H, PLAY_HEADER_H } from '../src/ui/boardLayout';

describe('portrait layout stress', () => {
  it('design 900x1400 has no stone/cell overflow and board in band', () => {
    const L = computeBoardLayout(900, 1400);
    expect(L.cell).toBeGreaterThan(0);
    expect(L.stoneSize).toBeLessThanOrEqual(L.cell);
    expect(L.originY).toBeGreaterThanOrEqual(PLAY_HEADER_H);
    expect(L.originY + L.boardVisual).toBeLessThanOrEqual(1400 - PLAY_FOOTER_H + 1);
  });

  it('stone size never exceeds cell on short canvases', () => {
    const L = computeBoardLayout(900, 600);
    expect(L.stoneSize).toBeLessThanOrEqual(L.cell);
    expect(L.stoneSize).toBeGreaterThan(0);
  });
});
