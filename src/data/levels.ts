import { Difficulty, TOTAL_LEVELS } from '../core/constants';
import type { LevelDef } from '../core/types';

/**
 * 30 campaign levels, difficulty ramps easy → hard.
 * AI always blocks immediate wins; early levels only soften quiet moves.
 *
 * 1–10   入门（简单）depth 2→3
 * 11–20  进阶（中等）depth 3→4
 * 21–30  高手（困难）depth 4
 */
export const CAMPAIGN_LEVELS: LevelDef[] = Array.from({ length: TOTAL_LEVELS }, (_, i) => {
  const id = i + 1;
  if (id <= 10) {
    const t = (id - 1) / 9;
    return {
      id,
      name: `第 ${id} 关`,
      subtitle: '入门试炼',
      difficulty: Difficulty.Easy,
      depth: t < 0.45 ? 2 : 3,
      // Low noise on quiet moves only — never skips win/block
      blunderRate: Math.max(0, 0.12 - t * 0.12),
      radius: 2,
    };
  }
  if (id <= 20) {
    const t = (id - 11) / 9;
    return {
      id,
      name: `第 ${id} 关`,
      subtitle: '进阶挑战',
      difficulty: Difficulty.Medium,
      depth: t < 0.5 ? 3 : 4,
      blunderRate: 0,
      radius: 3,
    };
  }
  const t = (id - 21) / 9;
  return {
    id,
    name: `第 ${id} 关`,
    subtitle: id >= 28 ? '终极试炼' : '高手对决',
    difficulty: Difficulty.Hard,
    depth: t > 0.55 ? 4 : 3,
    blunderRate: 0,
    radius: 3,
  };
});

export function getLevel(id: number): LevelDef | null {
  return CAMPAIGN_LEVELS.find((l) => l.id === id) ?? null;
}

export function levelDifficultyLabel(level: LevelDef): string {
  if (level.id <= 10) return '简单';
  if (level.id <= 20) return '中等';
  return '困难';
}
