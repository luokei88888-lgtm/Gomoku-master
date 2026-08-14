import { ErrorCode, GameResult, Stone } from './constants';
import {
  boardIsFull,
  cloneBoard,
  createEmptyBoard,
  findWinningLine,
  inBounds,
  opponent,
} from './board';
import type { CellPos, GameSnapshot, Move, PlaceResult, UndoResult } from './types';

/**
 * Pure freestyle gomoku state machine.
 * Black always moves first. No renju forbidden moves.
 */
export class GomokuGame {
  private board: Stone[][];
  private moves: Move[] = [];
  private current: Stone = Stone.Black;
  private result: GameResult = GameResult.None;
  private winningLine: CellPos[] | null = null;

  constructor(snapshot?: GameSnapshot) {
    if (snapshot) {
      this.board = cloneBoard(snapshot.board);
      this.moves = snapshot.moves.map((m) => ({ ...m }));
      this.current = snapshot.current;
      this.result = snapshot.result;
      this.winningLine = snapshot.winningLine
        ? snapshot.winningLine.map((p) => ({ ...p }))
        : null;
    } else {
      this.board = createEmptyBoard();
    }
  }

  getBoard(): Stone[][] {
    return cloneBoard(this.board);
  }

  getMoves(): Move[] {
    return this.moves.map((m) => ({ ...m }));
  }

  getCurrent(): Stone {
    return this.current;
  }

  getResult(): GameResult {
    return this.result;
  }

  getWinningLine(): CellPos[] | null {
    return this.winningLine ? this.winningLine.map((p) => ({ ...p })) : null;
  }

  isOver(): boolean {
    return this.result !== GameResult.None;
  }

  snapshot(): GameSnapshot {
    return {
      board: this.getBoard(),
      moves: this.getMoves(),
      current: this.current,
      result: this.result,
      winningLine: this.getWinningLine(),
    };
  }

  place(row: number, col: number): PlaceResult {
    if (this.isOver()) {
      return {
        ok: false,
        error: ErrorCode.GameOver,
        result: this.result,
        winningLine: this.getWinningLine(),
      };
    }
    if (!inBounds(row, col)) {
      return {
        ok: false,
        error: ErrorCode.InvalidMove,
        result: GameResult.None,
        winningLine: null,
      };
    }
    if (this.board[row]![col] !== Stone.Empty) {
      return {
        ok: false,
        error: ErrorCode.Occupied,
        result: GameResult.None,
        winningLine: null,
      };
    }

    const stone = this.current;
    this.board[row]![col] = stone;
    this.moves.push({ row, col, stone });

    const line = findWinningLine(this.board, row, col, stone);
    if (line) {
      this.winningLine = line;
      this.result = stone === Stone.Black ? GameResult.BlackWin : GameResult.WhiteWin;
      return { ok: true, result: this.result, winningLine: this.getWinningLine() };
    }

    if (boardIsFull(this.board)) {
      this.result = GameResult.Draw;
      return { ok: true, result: this.result, winningLine: null };
    }

    this.current = opponent(stone);
    return { ok: true, result: GameResult.None, winningLine: null };
  }

  /**
   * Undo one full turn when possible: remove AI reply + player move (2 stones),
   * or a single stone if only one move exists (e.g. player just moved, AI not yet).
   * Pass `preferPair=true` for the player undo button.
   */
  undo(preferPair = true): UndoResult {
    if (this.moves.length === 0) {
      return { ok: false, error: ErrorCode.NothingToUndo, removed: [] };
    }

    const removeCount =
      preferPair && this.moves.length >= 2 ? 2 : 1;
    const removed: Move[] = [];
    for (let i = 0; i < removeCount; i += 1) {
      const m = this.moves.pop()!;
      this.board[m.row]![m.col] = Stone.Empty;
      removed.push(m);
    }

    this.result = GameResult.None;
    this.winningLine = null;
    this.current =
      this.moves.length === 0
        ? Stone.Black
        : opponent(this.moves[this.moves.length - 1]!.stone);

    return { ok: true, removed };
  }

  /** Replay helpers: apply a move list from empty. */
  static fromMoves(positions: CellPos[]): GomokuGame {
    const g = new GomokuGame();
    for (const p of positions) {
      const r = g.place(p.row, p.col);
      if (!r.ok) break;
      if (r.result !== GameResult.None) break;
    }
    return g;
  }
}
