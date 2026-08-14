import { BOARD_SIZE, DIRS, Stone, WIN_COUNT } from './constants';
import type { CellPos } from './types';

export function createEmptyBoard(): Stone[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => Stone.Empty),
  );
}

export function cloneBoard(board: Stone[][]): Stone[][] {
  return board.map((row) => row.slice());
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function boardIsFull(board: Stone[][]): boolean {
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (board[r]![c] === Stone.Empty) return false;
    }
  }
  return true;
}

export function countEmpty(board: Stone[][]): number {
  let n = 0;
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (board[r]![c] === Stone.Empty) n += 1;
    }
  }
  return n;
}

/**
 * If placing `stone` at (row,col) forms a line of WIN_COUNT or more,
 * return the cells of one such line (for highlight). Otherwise null.
 */
export function findWinningLine(
  board: Stone[][],
  row: number,
  col: number,
  stone: Stone,
): CellPos[] | null {
  if (stone === Stone.Empty) return null;
  for (const [dr, dc] of DIRS) {
    const line: CellPos[] = [{ row, col }];
    for (const sign of [-1, 1] as const) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (inBounds(r, c) && board[r]![c] === stone) {
        line.push({ row: r, col: c });
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (line.length >= WIN_COUNT) {
      line.sort((a, b) => a.row - b.row || a.col - b.col);
      return line;
    }
  }
  return null;
}

export function opponent(stone: Stone): Stone {
  if (stone === Stone.Black) return Stone.White;
  if (stone === Stone.White) return Stone.Black;
  return Stone.Empty;
}

export function stoneCount(board: Stone[][]): number {
  return BOARD_SIZE * BOARD_SIZE - countEmpty(board);
}
