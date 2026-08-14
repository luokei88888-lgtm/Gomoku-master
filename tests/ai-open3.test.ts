import { describe, expect, it } from "vitest";
import { Stone, Difficulty } from "../src/core/constants";
import { createEmptyBoard } from "../src/core/board";
import { chooseMove } from "../src/ai/search";
import { scorePoint } from "../src/ai/evaluate";

describe("open-three defense", () => {
  it("blocks both ends of open three", () => {
    const b = createEmptyBoard();
    b[7]![5] = Stone.White;
    b[7]![6] = Stone.White;
    b[7]![7] = Stone.White;
    b[8]![8] = Stone.Black;
    for (const rnd of [0, 0.5, 0.99]) {
      const m = chooseMove(b, { difficulty: Difficulty.Easy, stone: Stone.Black, radius: 2, blunderRate: 0.99, random: () => rnd });
      expect(m && m.row === 7 && (m.col === 4 || m.col === 8), `rnd=${rnd} got ${JSON.stringify(m)}`).toBe(true);
    }
  });

  it("detects open four score at end of open three", () => {
    const b = createEmptyBoard();
    b[7]![5] = Stone.White;
    b[7]![6] = Stone.White;
    b[7]![7] = Stone.White;
    b[7]![4] = Stone.White; // temporarily
    // actually place at 4
    b[7]![4] = Stone.Empty;
    b[7]![4] = Stone.White;
    expect(scorePoint(b, 7, 4, Stone.White)).toBeGreaterThanOrEqual(100000);
  });

  it("blocks diagonal open three", () => {
    const b = createEmptyBoard();
    b[5]![5] = Stone.White;
    b[6]![6] = Stone.White;
    b[7]![7] = Stone.White;
    b[8]![5] = Stone.Black;
    const m = chooseMove(b, { difficulty: Difficulty.Medium, stone: Stone.Black, radius: 3, random: () => 0 });
    expect(m && ((m.row === 4 && m.col === 4) || (m.row === 8 && m.col === 8)), JSON.stringify(m)).toBe(true);
  });
});
