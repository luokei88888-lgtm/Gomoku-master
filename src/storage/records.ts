import {
  Difficulty,
  ErrorCode,
  GameResult,
  MAX_RECORDS,
  STORAGE_MAX_BYTES,
  STORAGE_RECORDS_KEY,
  STORAGE_VERSION,
  Stone,
  ThemeId,
} from '../core/constants';
import type { CellPos, GameRecord, RecordsStore } from '../core/types';

function emptyStore(): RecordsStore {
  return { version: STORAGE_VERSION, records: [] };
}

function sanitizeRecord(raw: unknown): GameRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<GameRecord>;
  if (typeof o.id !== 'string' || typeof o.createdAt !== 'number') return null;
  if (!Object.values(Difficulty).includes(o.difficulty as Difficulty)) return null;
  if (!Object.values(GameResult).includes(o.result as GameResult)) return null;
  if (o.playerStone !== Stone.Black && o.playerStone !== Stone.White) return null;
  if (!Object.values(ThemeId).includes(o.themeId as ThemeId)) return null;
  if (!Array.isArray(o.moves)) return null;
  const moves: CellPos[] = [];
  for (const m of o.moves) {
    if (!m || typeof m !== 'object') return null;
    const row = Number((m as CellPos).row);
    const col = Number((m as CellPos).col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
    moves.push({ row, col });
  }
  return {
    id: o.id,
    createdAt: o.createdAt,
    difficulty: o.difficulty as Difficulty,
    playerStone: o.playerStone,
    result: o.result as GameResult,
    moves,
    themeId: o.themeId as ThemeId,
  };
}

function sanitizeStore(raw: unknown): RecordsStore | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<RecordsStore>;
  if (o.version !== STORAGE_VERSION || !Array.isArray(o.records)) return null;
  const records: GameRecord[] = [];
  for (const r of o.records) {
    const s = sanitizeRecord(r);
    if (s) records.push(s);
  }
  return { version: STORAGE_VERSION, records: records.slice(0, MAX_RECORDS) };
}

export class RecordsRepository {
  constructor(
    private readonly key = STORAGE_RECORDS_KEY,
    private readonly storage: Storage | null = typeof localStorage !== 'undefined'
      ? localStorage
      : null,
  ) {}

  load(): RecordsStore {
    if (!this.storage) return emptyStore();
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return emptyStore();
      if (raw.length > STORAGE_MAX_BYTES) return emptyStore();
      return sanitizeStore(JSON.parse(raw)) ?? emptyStore();
    } catch {
      return emptyStore();
    }
  }

  list(): GameRecord[] {
    return this.load().records;
  }

  add(record: Omit<GameRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): {
    ok: boolean;
    error?: ErrorCode;
  } {
    const store = this.load();
    const full: GameRecord = {
      id: record.id ?? `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: record.createdAt ?? Date.now(),
      difficulty: record.difficulty,
      playerStone: record.playerStone,
      result: record.result,
      moves: record.moves.map((m) => ({ row: m.row, col: m.col })),
      themeId: record.themeId,
    };
    store.records = [full, ...store.records].slice(0, MAX_RECORDS);
    return this.save(store);
  }

  get(id: string): GameRecord | null {
    return this.list().find((r) => r.id === id) ?? null;
  }

  private save(store: RecordsStore): { ok: boolean; error?: ErrorCode } {
    if (!this.storage) return { ok: false, error: ErrorCode.SaveCorrupt };
    const text = JSON.stringify(store);
    if (text.length > STORAGE_MAX_BYTES) {
      // Drop oldest until fits
      while (store.records.length > 1 && JSON.stringify(store).length > STORAGE_MAX_BYTES) {
        store.records.pop();
      }
      if (JSON.stringify(store).length > STORAGE_MAX_BYTES) {
        return { ok: false, error: ErrorCode.SaveTooLarge };
      }
    }
    try {
      this.storage.setItem(this.key, JSON.stringify(store));
      return { ok: true };
    } catch {
      return { ok: false, error: ErrorCode.SaveCorrupt };
    }
  }
}

export const recordsRepo = new RecordsRepository();
