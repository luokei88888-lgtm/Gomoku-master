import {
  DEFAULT_DIFFICULTY,
  DEFAULT_THEME,
  DEFAULT_VOLUME,
  Difficulty,
  STORAGE_SETTINGS_KEY,
  STORAGE_VERSION,
  Stone,
  ThemeId,
} from '../core/constants';
import type { PlayerSettings } from '../core/types';

export function defaultSettings(): PlayerSettings {
  return {
    version: STORAGE_VERSION,
    themeId: DEFAULT_THEME,
    difficulty: DEFAULT_DIFFICULTY,
    playerStone: Stone.Black,
    volume: DEFAULT_VOLUME,
  };
}

function sanitize(raw: unknown): PlayerSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<PlayerSettings>;
  if (o.version !== STORAGE_VERSION) return null;
  const themeId = Object.values(ThemeId).includes(o.themeId as ThemeId)
    ? (o.themeId as ThemeId)
    : DEFAULT_THEME;
  const difficulty = Object.values(Difficulty).includes(o.difficulty as Difficulty)
    ? (o.difficulty as Difficulty)
    : DEFAULT_DIFFICULTY;
  const playerStone =
    o.playerStone === Stone.White || o.playerStone === Stone.Black
      ? o.playerStone
      : Stone.Black;
  return {
    version: STORAGE_VERSION,
    themeId,
    difficulty,
    playerStone,
    volume: Math.min(1, Math.max(0, Number(o.volume ?? DEFAULT_VOLUME))),
  };
}

export class SettingsRepository {
  constructor(
    private readonly key = STORAGE_SETTINGS_KEY,
    private readonly storage: Storage | null = typeof localStorage !== 'undefined'
      ? localStorage
      : null,
  ) {}

  load(): PlayerSettings {
    if (!this.storage) return defaultSettings();
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return defaultSettings();
      return sanitize(JSON.parse(raw)) ?? defaultSettings();
    } catch {
      return defaultSettings();
    }
  }

  save(settings: PlayerSettings): void {
    if (!this.storage) return;
    const payload: PlayerSettings = {
      version: STORAGE_VERSION,
      themeId: settings.themeId,
      difficulty: settings.difficulty,
      playerStone: settings.playerStone,
      volume: settings.volume,
    };
    try {
      this.storage.setItem(this.key, JSON.stringify(payload));
    } catch {
      /* ignore quota */
    }
  }
}

export const settingsRepo = new SettingsRepository();
