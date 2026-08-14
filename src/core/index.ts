export { BOARD_SIZE, WIN_COUNT, Stone, Difficulty, ThemeId, GameResult, ErrorCode } from './constants';
export { GomokuGame } from './game';
export {
  createEmptyBoard,
  cloneBoard,
  inBounds,
  boardIsFull,
  findWinningLine,
  opponent,
} from './board';
export type {
  CellPos,
  Move,
  PlaceResult,
  GameSnapshot,
  PlayerSettings,
  GameRecord,
  PlaySessionConfig,
} from './types';
