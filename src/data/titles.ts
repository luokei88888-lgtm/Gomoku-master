import { TITLE_MILESTONE } from '../core/constants';

export { TITLE_MILESTONE };

export interface CampaignTitleDef {
  /** Level that must be cleared to earn this title. */
  levelId: number;
  /** Short honorific shown in UI. */
  title: string;
  /** Congratulatory copy shown once when unlocked. */
  message: string;
}

/** Three titles for levels 10 / 20 / 30. */
export const CAMPAIGN_TITLES: readonly CampaignTitleDef[] = [
  {
    levelId: 10,
    title: '新锐棋手',
    message: '太棒了！你已闯过前 10 关，棋感渐入佳境。继续加油，下一站更精彩！',
  },
  {
    levelId: 20,
    title: '闯关达人',
    message: '势如破竹！20 关尽收囊中。你的落子越来越稳，称号实至名归！',
  },
  {
    levelId: 30,
    title: '棋圣传说',
    message: '传奇诞生！三十关全清。从入门到巅峰，你写下了属于自己的棋圣传说！',
  },
] as const;

export function isTitleMilestone(levelId: number): boolean {
  return levelId > 0 && levelId % TITLE_MILESTONE === 0 && getTitleByLevel(levelId) !== null;
}

export function getTitleByLevel(levelId: number): CampaignTitleDef | null {
  return CAMPAIGN_TITLES.find((t) => t.levelId === levelId) ?? null;
}

/** Highest earned title by milestone level, or null if none. */
export function getHighestTitle(earnedLevelIds: readonly number[]): CampaignTitleDef | null {
  let best: CampaignTitleDef | null = null;
  for (const id of earnedLevelIds) {
    const def = getTitleByLevel(id);
    if (!def) continue;
    if (!best || def.levelId > best.levelId) best = def;
  }
  return best;
}

/** Titles that should be unlocked given cleared stars (star > 0). */
export function titlesFromStars(stars: readonly number[]): number[] {
  return CAMPAIGN_TITLES.filter((t) => (stars[t.levelId - 1] ?? 0) > 0).map((t) => t.levelId);
}
