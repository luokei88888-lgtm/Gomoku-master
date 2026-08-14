import { describe, expect, it } from 'vitest';
import { Difficulty, Stone } from '../../src/core/constants';
import { createEmptyBoard } from '../../src/core/board';
import { candidateMoves } from '../../src/ai/evaluate';
import { chooseMove, wouldWin } from '../../src/ai/search';

describe('AI', () => {
  it('starts near center on empty board', () => {
    const b = createEmptyBoard();
    const m = chooseMove(b, { difficulty: Difficulty.Medium, stone: Stone.Black });
    expect(m).not.toBeNull();
    expect(Math.abs(m!.row - 7)).toBeLessThanOrEqual(1);
    expect(Math.abs(m!.col - 7)).toBeLessThanOrEqual(1);
  });

  it('takes immediate winning move', () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c += 1) b[7]![c] = Stone.Black;
    b[8]![3] = Stone.White;
    b[8]![4] = Stone.White;
    b[8]![5] = Stone.White;
    const m = chooseMove(b, { difficulty: Difficulty.Hard, stone: Stone.Black });
    expect(m && ((m.row === 7 && m.col === 7) || (m.row === 7 && m.col === 2))).toBe(true);
    expect(wouldWin(b, m!.row, m!.col, Stone.Black)).toBe(true);
  });

  it('blocks opponent four', () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c += 1) b[7]![c] = Stone.White;
    b[8]![5] = Stone.Black;
    const m = chooseMove(b, {
      difficulty: Difficulty.Hard,
      stone: Stone.Black,
      random: () => 0,
    });
    expect(m && ((m.row === 7 && m.col === 7) || (m.row === 7 && m.col === 2))).toBe(true);
  });

  it('easy mode still blocks opponent four', () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c += 1) b[7]![c] = Stone.White;
    b[8]![5] = Stone.Black;
    // random always high — would previously skip blocks via blunder
    const m = chooseMove(b, {
      difficulty: Difficulty.Easy,
      stone: Stone.Black,
      blunderRate: 0.9,
      random: () => 0.99,
    });
    expect(m && ((m.row === 7 && m.col === 7) || (m.row === 7 && m.col === 2))).toBe(true);
  });

  it('blocks open three that would become open four', () => {
    const b = createEmptyBoard();
    // White open three on row 7: . W W W .
    b[7]![5] = Stone.White;
    b[7]![6] = Stone.White;
    b[7]![7] = Stone.White;
    b[8]![8] = Stone.Black;
    const m = chooseMove(b, {
      difficulty: Difficulty.Medium,
      stone: Stone.Black,
      random: () => 0,
    });
    expect(m && m.row === 7 && (m.col === 4 || m.col === 8)).toBe(true);
  });

  it('candidateMoves stays near stones', () => {
    const b = createEmptyBoard();
    b[7]![7] = Stone.Black;
    const cands = candidateMoves(b, 2);
    expect(cands.every((p) => Math.abs(p.row - 7) <= 2 && Math.abs(p.col - 7) <= 2)).toBe(true);
  });

  it('wouldWin detects five', () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c += 1) b[7]![c] = Stone.Black;
    expect(wouldWin(b, 7, 7, Stone.Black)).toBe(true);
    expect(wouldWin(b, 0, 0, Stone.Black)).toBe(false);
  });
});
