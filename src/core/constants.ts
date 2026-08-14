/** Board size for freestyle gomoku. */
export const BOARD_SIZE = 15;

/** How many in a row to win. */
export const WIN_COUNT = 5;

export enum Stone {
  Empty = 0,
  Black = 1,
  White = 2,
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum ThemeId {
  Classic = 'classic',
  NightJade = 'night_jade',
  Digimon = 'digimon',
  Ultraman = 'ultraman',
}

export enum GameResult {
  None = 'none',
  BlackWin = 'black_win',
  WhiteWin = 'white_win',
  Draw = 'draw',
}

export enum ErrorCode {
  InvalidMove = 'INVALID_MOVE',
  Occupied = 'OCCUPIED',
  GameOver = 'GAME_OVER',
  NothingToUndo = 'NOTHING_TO_UNDO',
  SaveTooLarge = 'SAVE_TOO_LARGE',
  SaveCorrupt = 'SAVE_CORRUPT',
}

export const STORAGE_SETTINGS_KEY = 'gomoku.settings.v1';
export const STORAGE_RECORDS_KEY = 'gomoku.records.v1';
export const STORAGE_PROGRESS_KEY = 'gomoku.progress.v1';
export const STORAGE_VERSION = 1;
export const STORAGE_MAX_BYTES = 120_000;
export const MAX_RECORDS = 30;
export const TOTAL_LEVELS = 30;
/** Campaign title awarded every N cleared levels. */
export const TITLE_MILESTONE = 10;

export const DEFAULT_THEME = ThemeId.Digimon;
export const DEFAULT_DIFFICULTY = Difficulty.Medium;
export const DEFAULT_VOLUME = 0.7;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.Easy]: '简单',
  [Difficulty.Medium]: '中等',
  [Difficulty.Hard]: '困难',
};

export const THEME_LABELS: Record<ThemeId, string> = {
  [ThemeId.Classic]: '糖果派对',
  [ThemeId.NightJade]: '花园鲜果',
  [ThemeId.Digimon]: '数码大冒险',
  [ThemeId.Ultraman]: '光之英雄',
};

/** Directions for win checks: horizontal, vertical, two diagonals. */
export const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];
