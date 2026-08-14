import { BOARD_SIZE, DIRS, Stone } from '../core/constants';
import { inBounds, opponent } from '../core/board';
import type { CellPos } from '../core/types';

/** Pattern scores — open fours/threes must dominate so AI blocks threats. */
const SCORE = {
  FIVE: 1_000_000,
  OPEN_FOUR: 100_000,
  CLOSED_FOUR: 20_000,
  OPEN_THREE: 8_000,
  CLOSED_THREE: 800,
  OPEN_TWO: 400,
  CLOSED_TWO: 80,
  ONE: 10,
} as const;

/**
 * Collect candidate empty cells within `radius` of any occupied stone.
 * On empty board, returns center.
 */
export function candidateMoves(board: Stone[][], radius = 2): CellPos[] {
  const occupied: CellPos[] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (board[r]![c] !== Stone.Empty) occupied.push({ row: r, col: c });
    }
  }
  if (occupied.length === 0) {
    const mid = Math.floor(BOARD_SIZE / 2);
    return [{ row: mid, col: mid }];
  }

  const seen = new Set<string>();
  const out: CellPos[] = [];
  for (const p of occupied) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        const r = p.row + dr;
        const c = p.col + dc;
        if (!inBounds(r, c) || board[r]![c] !== Stone.Empty) continue;
        const key = `${r},${c}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ row: r, col: c });
      }
    }
  }
  return out;
}

function countDirection(
  board: Stone[][],
  row: number,
  col: number,
  dr: number,
  dc: number,
  stone: Stone,
): { count: number; open: boolean } {
  let count = 0;
  let r = row + dr;
  let c = col + dc;
  while (inBounds(r, c) && board[r]![c] === stone) {
    count += 1;
    r += dr;
    c += dc;
  }
  const open = inBounds(r, c) && board[r]![c] === Stone.Empty;
  return { count, open };
}

/** Score a single cell as if `stone` were already placed there. */
export function scorePoint(board: Stone[][], row: number, col: number, stone: Stone): number {
  let total = 0;
  for (const [dr, dc] of DIRS) {
    const a = countDirection(board, row, col, dr, dc, stone);
    const b = countDirection(board, row, col, -dr, -dc, stone);
    const len = a.count + b.count + 1;
    const openEnds = (a.open ? 1 : 0) + (b.open ? 1 : 0);

    if (len >= 5) {
      total += SCORE.FIVE;
      continue;
    }
    if (len === 4) {
      total += openEnds === 2 ? SCORE.OPEN_FOUR : openEnds === 1 ? SCORE.CLOSED_FOUR : 0;
      continue;
    }
    if (len === 3) {
      total += openEnds === 2 ? SCORE.OPEN_THREE : openEnds === 1 ? SCORE.CLOSED_THREE : 0;
      continue;
    }
    if (len === 2) {
      total += openEnds === 2 ? SCORE.OPEN_TWO : openEnds === 1 ? SCORE.CLOSED_TWO : 0;
      continue;
    }
    if (len === 1 && openEnds > 0) total += SCORE.ONE;
  }
  return total;
}

/**
 * Static evaluation from `forStone`'s perspective (positive = good for forStone).
 * Opponent threats are weighted heavier so defense is preferred.
 */
export function evaluateBoard(board: Stone[][], forStone: Stone): number {
  const opp = opponent(forStone);
  let mine = 0;
  let theirs = 0;
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const s = board[r]![c]!;
      if (s === forStone) mine += scorePoint(board, r, c, forStone);
      else if (s === opp) theirs += scorePoint(board, r, c, opp);
    }
  }
  return mine - theirs * 1.15;
}

/** Immediate win / block urgency for move ordering. */
export function movePriority(board: Stone[][], row: number, col: number, stone: Stone): number {
  board[row]![col] = stone;
  const attack = scorePoint(board, row, col, stone);
  board[row]![col] = Stone.Empty;

  const opp = opponent(stone);
  board[row]![col] = opp;
  const defense = scorePoint(board, row, col, opp);
  board[row]![col] = Stone.Empty;

  // Prefer stopping opponent threats slightly over equal attacks.
  return attack * 2 + defense * 2.4;
}

/** All empty cells where `stone` would win immediately. */
export function winningCells(board: Stone[][], stone: Stone, radius = 3): CellPos[] {
  const out: CellPos[] = [];
  for (const m of candidateMoves(board, radius)) {
    board[m.row]![m.col] = stone;
    let win = false;
    for (const [dr, dc] of DIRS) {
      const x = countDirection(board, m.row, m.col, dr, dc, stone);
      const y = countDirection(board, m.row, m.col, -dr, -dc, stone);
      if (x.count + y.count + 1 >= 5) {
        win = true;
        break;
      }
    }
    board[m.row]![m.col] = Stone.Empty;
    if (win) out.push(m);
  }
  return out;
}
