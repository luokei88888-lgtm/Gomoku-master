import {
  ErrorCode,
  STORAGE_MAX_BYTES,
  STORAGE_PROGRESS_KEY,
  STORAGE_VERSION,
  TOTAL_LEVELS,
} from '../core/constants';
import type { CampaignProgress } from '../core/types';
import { getTitleByLevel, titlesFromStars } from '../data/titles';

export function defaultProgress(): CampaignProgress {
  return {
    version: STORAGE_VERSION,
    maxUnlocked: 1,
    stars: Array.from({ length: TOTAL_LEVELS }, () => 0),
    titles: [],
  };
}

function sanitizeTitles(raw: unknown, stars: number[]): number[] {
  const fromStars = titlesFromStars(stars);
  if (!Array.isArray(raw)) return fromStars;
  const parsed = raw
    .filter((id): id is number => typeof id === 'number' && getTitleByLevel(id) !== null)
    .map((id) => Math.floor(id));
  return Array.from(new Set([...parsed, ...fromStars])).sort((a, b) => a - b);
}

/** Infer unlock floor from cleared stars so corrupt saves stay playable. */
export function unlockFloorFromStars(stars: readonly number[]): number {
  let highestCleared = 0;
  for (let i = 0; i < stars.length; i += 1) {
    if ((stars[i] ?? 0) > 0) highestCleared = i + 1;
  }
  if (highestCleared <= 0) return 1;
  if (highestCleared >= TOTAL_LEVELS) return TOTAL_LEVELS;
  return highestCleared + 1;
}

function sanitize(raw: unknown): CampaignProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<CampaignProgress>;
  if (o.version !== STORAGE_VERSION) return null;
  if (typeof o.maxUnlocked !== 'number' || !Number.isFinite(o.maxUnlocked)) return null;
  if (!Array.isArray(o.stars)) return null;
  const stars = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
    const s = o.stars![i];
    return typeof s === 'number' && Number.isFinite(s)
      ? Math.min(3, Math.max(0, Math.floor(s)))
      : 0;
  });
  const reported = Math.min(TOTAL_LEVELS, Math.max(1, Math.floor(o.maxUnlocked)));
  return {
    version: STORAGE_VERSION,
    maxUnlocked: Math.max(reported, unlockFloorFromStars(stars)),
    stars,
    titles: sanitizeTitles(o.titles, stars),
  };
}

function normalize(progress: CampaignProgress): CampaignProgress {
  const stars = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
    const s = progress.stars[i];
    return typeof s === 'number' && Number.isFinite(s)
      ? Math.min(3, Math.max(0, Math.floor(s)))
      : 0;
  });
  const reported = Math.min(
    TOTAL_LEVELS,
    Math.max(1, Math.floor(Number.isFinite(progress.maxUnlocked) ? progress.maxUnlocked : 1)),
  );
  return {
    version: STORAGE_VERSION,
    maxUnlocked: Math.max(reported, unlockFloorFromStars(stars)),
    stars,
    titles: sanitizeTitles(progress.titles, stars),
  };
}

export class ProgressRepository {
  constructor(
    private readonly key = STORAGE_PROGRESS_KEY,
    private readonly storage: Storage | null = typeof localStorage !== 'undefined'
      ? localStorage
      : null,
  ) {}

  load(): CampaignProgress {
    if (!this.storage) return defaultProgress();
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return defaultProgress();
      if (raw.length > STORAGE_MAX_BYTES) return defaultProgress();
      return sanitize(JSON.parse(raw)) ?? defaultProgress();
    } catch {
      return defaultProgress();
    }
  }

  save(progress: CampaignProgress): { ok: boolean; error?: ErrorCode } {
    if (!this.storage) return { ok: false, error: ErrorCode.SaveCorrupt };
    const payload = normalize(progress);
    const text = JSON.stringify(payload);
    if (text.length > STORAGE_MAX_BYTES) {
      return { ok: false, error: ErrorCode.SaveTooLarge };
    }
    try {
      this.storage.setItem(this.key, text);
      return { ok: true };
    } catch {
      return { ok: false, error: ErrorCode.SaveCorrupt };
    }
  }
}

/**
 * Record a campaign win. Stars: 1 always, 2 if ≤36 moves, 3 if ≤24 moves.
 * Unlocks next level when cleared. Awards title at milestone levels.
 */
export function starsForClear(moveCount: number): number {
  if (!Number.isFinite(moveCount) || moveCount < 1) return 1;
  if (moveCount <= 24) return 3;
  if (moveCount <= 36) return 2;
  return 1;
}

export interface LevelWinResult {
  progress: CampaignProgress;
  /** Newly awarded title milestone level, if any. */
  newTitleLevelId: number | null;
}

export function recordLevelWin(
  progress: CampaignProgress,
  levelId: number,
  moveCount: number,
): LevelWinResult {
  const next: CampaignProgress = {
    version: STORAGE_VERSION,
    maxUnlocked: progress.maxUnlocked,
    stars: progress.stars.slice(),
    titles: progress.titles.slice(),
  };
  const stars = starsForClear(moveCount);

  const idx = levelId - 1;
  if (idx >= 0 && idx < next.stars.length) {
    next.stars[idx] = Math.max(next.stars[idx]!, stars);
  }
  if (levelId >= next.maxUnlocked && levelId < TOTAL_LEVELS) {
    next.maxUnlocked = levelId + 1;
  } else if (levelId === TOTAL_LEVELS) {
    next.maxUnlocked = TOTAL_LEVELS;
  }

  let newTitleLevelId: number | null = null;
  const titleDef = getTitleByLevel(levelId);
  if (titleDef && !next.titles.includes(levelId)) {
    next.titles.push(levelId);
    next.titles.sort((a, b) => a - b);
    newTitleLevelId = levelId;
  }

  return { progress: next, newTitleLevelId };
}

export const progressRepo = new ProgressRepository();

