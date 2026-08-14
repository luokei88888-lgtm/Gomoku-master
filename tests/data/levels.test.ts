import { describe, expect, it } from 'vitest';
import { Difficulty, TOTAL_LEVELS } from '../../src/core/constants';
import { CAMPAIGN_LEVELS, getLevel } from '../../src/data/levels';
import { CAMPAIGN_TITLES, getHighestTitle, getTitleByLevel } from '../../src/data/titles';
import {
  defaultProgress,
  recordLevelWin,
  starsForClear,
  unlockFloorFromStars,
} from '../../src/storage/progress';

describe('campaign levels', () => {
  it('has TOTAL_LEVELS entries ramping difficulty', () => {
    expect(TOTAL_LEVELS).toBe(30);
    expect(CAMPAIGN_LEVELS).toHaveLength(TOTAL_LEVELS);
    expect(CAMPAIGN_LEVELS[0]!.difficulty).toBe(Difficulty.Easy);
    expect(CAMPAIGN_LEVELS[9]!.difficulty).toBe(Difficulty.Easy);
    expect(CAMPAIGN_LEVELS[10]!.difficulty).toBe(Difficulty.Medium);
    expect(CAMPAIGN_LEVELS[19]!.difficulty).toBe(Difficulty.Medium);
    expect(CAMPAIGN_LEVELS[20]!.difficulty).toBe(Difficulty.Hard);
    expect(CAMPAIGN_LEVELS[TOTAL_LEVELS - 1]!.difficulty).toBe(Difficulty.Hard);
  });

  it('getLevel returns by id', () => {
    expect(getLevel(1)?.id).toBe(1);
    expect(getLevel(30)?.id).toBe(30);
    expect(getLevel(31)).toBeNull();
  });

  it('hard levels ramp depth from 3 to 4', () => {
    expect(CAMPAIGN_LEVELS[20]!.depth).toBe(3);
    expect(CAMPAIGN_LEVELS[TOTAL_LEVELS - 1]!.depth).toBe(4);
  });
});

describe('campaign progress', () => {
  it('unlocks next level and keeps best stars', () => {
    let p = defaultProgress();
    expect(p.maxUnlocked).toBe(1);
    expect(p.titles).toEqual([]);
    const r1 = recordLevelWin(p, 1, 40);
    p = r1.progress;
    expect(p.maxUnlocked).toBe(2);
    expect(p.stars[0]).toBe(1);
    expect(r1.newTitleLevelId).toBeNull();
    const r2 = recordLevelWin(p, 1, 20);
    p = r2.progress;
    expect(p.stars[0]).toBe(3);
    expect(p.maxUnlocked).toBe(2);
  });

  it('awards a title every 10 levels', () => {
    let p = defaultProgress();
    for (const def of CAMPAIGN_TITLES) {
      const { progress, newTitleLevelId } = recordLevelWin(p, def.levelId, 30);
      p = progress;
      expect(newTitleLevelId).toBe(def.levelId);
      expect(p.titles).toContain(def.levelId);
      expect(getTitleByLevel(def.levelId)?.title).toBeTruthy();
    }
    expect(p.titles).toEqual([10, 20, 30]);
    expect(getHighestTitle(p.titles)?.title).toBe('棋圣传说');

    const again = recordLevelWin(p, 10, 10);
    expect(again.newTitleLevelId).toBeNull();
    expect(again.progress.titles).toEqual([10, 20, 30]);
  });

  it('starsForClear bounds', () => {
    expect(starsForClear(0)).toBe(1);
    expect(starsForClear(24)).toBe(3);
    expect(starsForClear(25)).toBe(2);
    expect(starsForClear(36)).toBe(2);
    expect(starsForClear(37)).toBe(1);
  });

  it('unlockFloorFromStars repairs unlock from cleared stars', () => {
    const stars = Array.from({ length: TOTAL_LEVELS }, () => 0);
    stars[9] = 2;
    expect(unlockFloorFromStars(stars)).toBe(11);
    stars[29] = 1;
    expect(unlockFloorFromStars(stars)).toBe(TOTAL_LEVELS);
  });
});
