import { describe, expect, it } from "vitest";
import { Difficulty, Stone, BOARD_SIZE, STORAGE_VERSION, TOTAL_LEVELS } from "../src/core/constants";
import { createEmptyBoard } from "../src/core/board";
import { chooseMove, wouldWin } from "../src/ai/search";
import { winningCells } from "../src/ai/evaluate";
import { CAMPAIGN_LEVELS } from "../src/data/levels";
import { computeBoardLayout, PLAY_HEADER_H, PLAY_FOOTER_H } from "../src/ui/boardLayout";
import { ProgressRepository } from "../src/storage/progress";

describe("review probes", () => {
  it("AI always picks an opponent winning cell when one exists", () => {
    let checked = 0;
    for (const lvl of [1, 10, 15, 30]) {
      const L = CAMPAIGN_LEVELS[lvl - 1]!;
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c <= BOARD_SIZE - 5; c++) {
          for (let gap = 0; gap < 5; gap++) {
            const b = createEmptyBoard();
            for (let k = 0; k < 5; k++) if (k !== gap) b[r]![c + k] = Stone.White;
            const sr = (r + 3) % BOARD_SIZE;
            const sc = (c + 7) % BOARD_SIZE;
            if (b[sr]![sc] === Stone.Empty) b[sr]![sc] = Stone.Black;
            const empty = { row: r, col: c + gap };
            if (b[empty.row]![empty.col] !== Stone.Empty) continue;
            if (!wouldWin(b, empty.row, empty.col, Stone.White)) continue;
            const threats = winningCells(b, Stone.White, L.radius);
            expect(threats.length).toBeGreaterThan(0);
            const m = chooseMove(b, {
              difficulty: L.difficulty,
              stone: Stone.Black,
              radius: L.radius,
              depth: L.depth,
              blunderRate: 0.99,
              random: () => 0.99,
            });
            expect(m).not.toBeNull();
            expect(threats.some((t) => t.row === m!.row && t.col === m!.col)).toBe(true);
            checked++;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it("AI prefers own win over blocking", () => {
    const b = createEmptyBoard();
    for (let c = 3; c <= 6; c++) b[7]![c] = Stone.Black;
    for (let c = 3; c <= 6; c++) b[9]![c] = Stone.White;
    const m = chooseMove(b, { difficulty: Difficulty.Easy, stone: Stone.Black, radius: 2, blunderRate: 0.99, random: () => 0.99 });
    expect(m && m.row === 7 && (m.col === 2 || m.col === 7)).toBe(true);
  });

  it("layout fits design canvas", () => {
    const L = computeBoardLayout(900, 1400);
    expect(L.stoneSize).toBeLessThanOrEqual(L.cell);
    expect(L.originY + L.boardVisual).toBeLessThanOrEqual(1400 - PLAY_FOOTER_H);
    expect(L.originY).toBeGreaterThanOrEqual(PLAY_HEADER_H);
  });

  it("sanitize pads short stars to 30 and caps long", () => {
    const store: Record<string, string> = {};
    const storage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    store["gomoku.progress.v1"] = JSON.stringify({
      version: STORAGE_VERSION,
      maxUnlocked: 15,
      stars: Array.from({ length: 20 }, (_, i) => (i < 14 ? 1 : 0)),
      titles: [10],
    });
    const repo = new ProgressRepository("gomoku.progress.v1", storage);
    const p = repo.load();
    expect(p.stars).toHaveLength(TOTAL_LEVELS);
    expect(p.stars[29]).toBe(0);
    expect(p.titles).toEqual([10]);
  });
});
