import { describe, expect, it } from 'vitest';
import { Difficulty, Stone } from '../src/core/constants';
import { createEmptyBoard } from '../src/core/board';
import { chooseMove } from '../src/ai/search';
import { winningCells } from '../src/ai/evaluate';

describe('radius edge', () => {
  it('radius 2 still blocks a distant four while another cluster exists', () => {
    const b = createEmptyBoard();
    for (let c = 1; c <= 4; c += 1) b[1]![c] = Stone.White;
    // Distant decoy — not a four, so AI must block White instead of chasing this
    b[13]![10] = Stone.Black;
    b[13]![11] = Stone.Black;
    const wins = winningCells(b, Stone.White, 2);
    expect(wins.some((p) => p.row === 1 && (p.col === 0 || p.col === 5))).toBe(true);
    const m = chooseMove(b, {
      difficulty: Difficulty.Easy,
      stone: Stone.Black,
      radius: 2,
      blunderRate: 1,
      random: () => 0.99,
    });
    expect(m && m.row === 1 && (m.col === 0 || m.col === 5)).toBe(true);
  });
});
