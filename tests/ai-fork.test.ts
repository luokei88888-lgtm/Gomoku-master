import { describe, expect, it } from "vitest";
import { Stone, Difficulty } from "../src/core/constants";
import { createEmptyBoard } from "../src/core/board";
import { chooseMove } from "../src/ai/search";

// Live-four / double threat: two separate fours — AI can only block one (forced loss).
// More interesting: AI has a win AND must not blunder.

describe("fork threats", () => {
  it("takes win even if opponent also has four", () => {
    const b = createEmptyBoard();
    for (let c = 2; c <= 5; c++) b[7]![c] = Stone.Black;
    for (let c = 2; c <= 5; c++) b[9]![c] = Stone.White;
    const m = chooseMove(b, { difficulty: Difficulty.Easy, stone: Stone.Black, radius: 2, blunderRate: 1, random: () => 0.99 });
    expect(wouldWinRow(m, 7)).toBe(true);
  });

  it("blocks when only defense available", () => {
    const b = createEmptyBoard();
    for (let c = 2; c <= 5; c++) b[9]![c] = Stone.White;
    b[7]![7] = Stone.Black;
    const m = chooseMove(b, { difficulty: Difficulty.Easy, stone: Stone.Black, radius: 2, blunderRate: 1, random: () => 0.99 });
    expect(m && m.row === 9 && (m.col === 1 || m.col === 6)).toBe(true);
  });
});

function wouldWinRow(m: {row:number;col:number}|null, row: number) {
  return Boolean(m && m.row === row && (m.col === 1 || m.col === 6));
}
