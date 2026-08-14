import { Difficulty, Stone, WIN_COUNT } from '../core/constants';
import { findWinningLine, opponent } from '../core/board';
import type { CellPos } from '../core/types';
import { candidateMoves, evaluateBoard, movePriority, scorePoint, winningCells } from './evaluate';

export interface AiOptions {
  difficulty: Difficulty;
  /** Whose turn to play. */
  stone: Stone;
  /** Optional RNG for easy-mode noise. */
  random?: () => number;
  /** Optional overrides for campaign fine-tuning. */
  depth?: number;
  blunderRate?: number;
  radius?: number;
}

interface SearchConfig {
  depth: number;
  /** Probability of picking a suboptimal *non-critical* move. */
  blunderRate: number;
  radius: number;
  branch: number;
}

const CONFIG: Record<Difficulty, SearchConfig> = {
  [Difficulty.Easy]: { depth: 2, blunderRate: 0.08, radius: 2, branch: 18 },
  [Difficulty.Medium]: { depth: 3, blunderRate: 0, radius: 3, branch: 24 },
  [Difficulty.Hard]: { depth: 3, blunderRate: 0, radius: 3, branch: 28 },
};

function orderMoves(board: Stone[][], moves: CellPos[], stone: Stone): CellPos[] {
  return moves
    .map((m) => ({ m, p: movePriority(board, m.row, m.col, stone) }))
    .sort((a, b) => b.p - a.p)
    .map((x) => x.m);
}

function minimax(
  board: Stone[][],
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  aiStone: Stone,
  radius: number,
  branch: number,
): number {
  const current = maximizing ? aiStone : opponent(aiStone);

  if (depth === 0) {
    return evaluateBoard(board, aiStone);
  }

  const moves = orderMoves(board, candidateMoves(board, radius), current).slice(0, branch);
  if (moves.length === 0) return 0;

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      board[m.row]![m.col] = current;
      const win = findWinningLine(board, m.row, m.col, current);
      let score: number;
      if (win) score = 10_000_000 + depth;
      else score = minimax(board, depth - 1, alpha, beta, false, aiStone, radius, branch);
      board[m.row]![m.col] = Stone.Empty;
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Infinity;
  for (const m of moves) {
    board[m.row]![m.col] = current;
    const win = findWinningLine(board, m.row, m.col, current);
    let score: number;
    if (win) score = -10_000_000 - depth;
    else score = minimax(board, depth - 1, alpha, beta, true, aiStone, radius, branch);
    board[m.row]![m.col] = Stone.Empty;
    best = Math.min(best, score);
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/** True if placing `stone` here creates an open four (two open ends on a 4). */
function createsOpenFour(board: Stone[][], row: number, col: number, stone: Stone): boolean {
  board[row]![col] = stone;
  const score = scorePoint(board, row, col, stone);
  board[row]![col] = Stone.Empty;
  return score >= 100_000; // OPEN_FOUR threshold
}

/**
 * Pick the best move for `stone` under the given difficulty.
 * Always takes wins and always blocks opponent wins — blunders never skip those.
 */
export function chooseMove(board: Stone[][], options: AiOptions): CellPos | null {
  const base = CONFIG[options.difficulty];
  const cfg: SearchConfig = {
    depth: options.depth ?? base.depth,
    blunderRate: options.blunderRate ?? base.blunderRate,
    radius: options.radius ?? base.radius,
    branch: base.branch,
  };
  const rnd = options.random ?? Math.random;
  const stone = options.stone;
  const opp = opponent(stone);

  const work = board.map((row) => row.slice());

  // 1) Instant win — never skip
  const myWins = winningCells(work, stone, cfg.radius);
  if (myWins.length > 0) return myWins[0]!;

  // 2) Block opponent win — never skip (even on Easy)
  const oppWins = winningCells(work, opp, cfg.radius);
  if (oppWins.length > 0) return oppWins[0]!;

  let moves = orderMoves(work, candidateMoves(work, cfg.radius), stone);
  if (moves.length === 0) return null;

  // 3) Create our open four if possible
  for (const m of moves) {
    if (createsOpenFour(work, m.row, m.col, stone)) return m;
  }

  // 4) Block opponent open-four creation (stop their open three)
  const blocks: CellPos[] = [];
  for (const m of moves) {
    if (createsOpenFour(work, m.row, m.col, opp)) blocks.push(m);
  }
  if (blocks.length === 1) return blocks[0]!;
  if (blocks.length > 1) {
    // Prefer the block that also builds our shape
    blocks.sort(
      (a, b) =>
        movePriority(work, b.row, b.col, stone) - movePriority(work, a.row, a.col, stone),
    );
    return blocks[0]!;
  }

  moves = moves.slice(0, cfg.branch);
  const scored: { m: CellPos; score: number }[] = [];
  for (const m of moves) {
    work[m.row]![m.col] = stone;
    const score = minimax(
      work,
      Math.max(0, cfg.depth - 1),
      -Infinity,
      Infinity,
      false,
      stone,
      cfg.radius,
      cfg.branch,
    );
    work[m.row]![m.col] = Stone.Empty;
    scored.push({ m, score });
  }
  scored.sort((a, b) => b.score - a.score);

  // Blunder only among quiet moves — never when top score is a forced threat.
  if (cfg.blunderRate > 0 && scored.length > 1 && rnd() < cfg.blunderRate) {
    const top = scored[0]!.score;
    const quiet = scored.filter((s) => s.score > top - 5_000);
    if (quiet.length > 1) {
      const idx = 1 + Math.floor(rnd() * Math.min(2, quiet.length - 1));
      return quiet[idx]!.m;
    }
  }

  return scored[0]!.m;
}

/** Hint uses the same engine as the current difficulty (no blunder). */
export function hintMove(
  board: Stone[][],
  stone: Stone,
  difficulty: Difficulty,
  extras?: Pick<AiOptions, 'depth' | 'blunderRate' | 'radius'>,
): CellPos | null {
  return chooseMove(board, {
    difficulty,
    stone,
    ...extras,
    blunderRate: 0,
    random: () => 0,
  });
}

/** Exported for tests — detects five-in-a-row after a hypothetical place. */
export function wouldWin(board: Stone[][], row: number, col: number, stone: Stone): boolean {
  if (board[row]![col] !== Stone.Empty) return false;
  board[row]![col] = stone;
  const line = findWinningLine(board, row, col, stone);
  board[row]![col] = Stone.Empty;
  return Boolean(line && line.length >= WIN_COUNT);
}
