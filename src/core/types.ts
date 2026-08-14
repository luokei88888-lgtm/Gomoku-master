import type { Difficulty, GameResult, Stone, ThemeId } from './constants';

export interface CellPos {
  row: number;
  col: number;
}

export interface Move {
  row: number;
  col: number;
  stone: Stone;
}

export interface PlaceResult {
  ok: boolean;
  error?: string;
  result: GameResult;
  winningLine: CellPos[] | null;
}

export interface UndoResult {
  ok: boolean;
  error?: string;
  removed: Move[];
}

export interface GameSnapshot {
  board: Stone[][];
  moves: Move[];
  current: Stone;
  result: GameResult;
  winningLine: CellPos[] | null;
}

export interface PlayerSettings {
  version: number;
  themeId: ThemeId;
  difficulty: Difficulty;
  /** Player plays as this color. Black always moves first. */
  playerStone: Stone.Black | Stone.White;
  volume: number;
}

export interface GameRecord {
  id: string;
  createdAt: number;
  difficulty: Difficulty;
  playerStone: Stone.Black | Stone.White;
  result: GameResult;
  moves: CellPos[];
  themeId: ThemeId;
}

export interface RecordsStore {
  version: number;
  records: GameRecord[];
}

export type PlayMode = 'free' | 'campaign';

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  difficulty: Difficulty;
  /** Optional AI search depth override. */
  depth?: number;
  /** Optional AI blunder rate override (0..1). */
  blunderRate?: number;
  /** Optional candidate radius around stones. */
  radius?: number;
}

export interface CampaignProgress {
  version: number;
  maxUnlocked: number;
  stars: number[];
  /** Milestone level ids that awarded a title (10, 20, 30). */
  titles: number[];
}

export interface PlaySessionConfig {
  mode: PlayMode;
  difficulty: Difficulty;
  playerStone: Stone.Black | Stone.White;
  themeId: ThemeId;
  /** Set when mode === 'campaign'. */
  levelId?: number;
  aiDepth?: number;
  aiBlunderRate?: number;
  aiRadius?: number;
}
