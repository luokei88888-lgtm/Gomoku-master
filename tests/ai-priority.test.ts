import { describe, expect, it } from "vitest";
import { Stone, Difficulty } from "../src/core/constants";
import { createEmptyBoard } from "../src/core/board";
import { chooseMove } from "../src/ai/search";

describe("must block open three before blunder", () => {
  it("easy+blunder still blocks open three", () => {
    const b = createEmptyBoard();
    b[7]![5] = Stone.White;
    b[7]![6] = Stone.White;
    b[7]![7] = Stone.White;
    b[10]![10] = Stone.Black;
    const m = chooseMove(b, {
      difficulty: Difficulty.Easy,
      stone: Stone.Black,
      radius: 2,
      depth: 2,
      blunderRate: 1,
      random: () => 0.99,
    });
    expect(m && m.row === 7 && (m.col === 4 || m.col === 8)).toBe(true);
  });

  it("blocks immediate win when open three also present", () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c++) b[5]![c] = Stone.White;
    b[9]![5] = Stone.White;
    b[9]![6] = Stone.White;
    b[9]![7] = Stone.White;
    b[8]![8] = Stone.Black;
    const m = chooseMove(b, {
      difficulty: Difficulty.Easy,
      stone: Stone.Black,
      radius: 2,
      blunderRate: 1,
      random: () => 0.99,
    });
    expect(m && m.row === 5 && (m.col === 2 || m.col === 7)).toBe(true);
  });
});
