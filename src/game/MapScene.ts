import Phaser from 'phaser';
import { TOTAL_LEVELS } from '../core/constants';
import { Stone } from '../core/constants';
import { bakeThemeTextures } from '../art/textures';
import { getTheme, setTheme } from '../art/themes';
import { getSfx } from '../audio/sfx';
import { CAMPAIGN_LEVELS, getLevel, levelDifficultyLabel } from '../data/levels';
import { progressRepo } from '../storage/progress';
import { settingsRepo } from '../storage/settings';
import { getHighestTitle } from '../data/titles';
import { fillBackground, hex, makeButton, titleText } from '../ui/widgets';

const COLS = 5;
const ROWS = 6;
const PER_PAGE = COLS * ROWS; // 30 — one page for all levels
const TOTAL_PAGES = Math.ceil(TOTAL_LEVELS / PER_PAGE);

interface MapBoot {
  page?: number;
}

export class MapScene extends Phaser.Scene {
  private page = 0;

  constructor() {
    super('Map');
  }

  init(data: MapBoot): void {
    const progress = progressRepo.load();
    const focus = Math.max(0, progress.maxUnlocked - 1);
    const defaultPage = Math.floor(focus / PER_PAGE);
    this.page = Math.min(
      TOTAL_PAGES - 1,
      Math.max(0, typeof data?.page === 'number' ? data.page : defaultPage),
    );
  }

  create(): void {
    const settings = settingsRepo.load();
    setTheme(settings.themeId);
    bakeThemeTextures(this);
    const theme = getTheme();
    const sfx = getSfx(settings.volume);
    const progress = progressRepo.load();
    fillBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;

    titleText(this, W / 2, 42, '闯关模式', 40);
    const highest = getHighestTitle(progress.titles);
    this.add
      .text(
        W / 2,
        84,
        highest
          ? `称号「${highest.title}」 · 已解锁 ${progress.maxUnlocked} / ${TOTAL_LEVELS} 关`
          : `已解锁 ${progress.maxUnlocked} / ${TOTAL_LEVELS} 关 · 每 10 关可获称号`,
        {
          fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          color: theme.muted,
        },
      )
      .setOrigin(0.5);

    const cellW = Math.min(150, Math.floor((W - 48) / COLS));
    const cellH = Math.min(96, Math.floor(cellW * 0.64));
    const gridW = COLS * cellW;
    const gridH = ROWS * cellH;
    const startX = (W - gridW) / 2 + cellW / 2;
    const startY = 140;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25);
    g.fillRoundedRect(startX - cellW / 2 - 16 + 4, startY - 36 + 6, gridW + 32, gridH + 36, 20);
    g.fillStyle(hex(theme.panel), 1);
    g.fillRoundedRect(startX - cellW / 2 - 16, startY - 36, gridW + 32, gridH + 36, 20);
    g.lineStyle(2, hex(theme.panelBorder), 0.9);
    g.strokeRoundedRect(startX - cellW / 2 - 16, startY - 36, gridW + 32, gridH + 36, 20);

    const startId = this.page * PER_PAGE + 1;
    const endId = Math.min(TOTAL_LEVELS, startId + PER_PAGE - 1);

    for (let id = startId; id <= endId; id += 1) {
      const i = id - startId;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const level = CAMPAIGN_LEVELS[id - 1]!;
      const unlocked = id <= progress.maxUnlocked;
      const stars = progress.stars[id - 1] ?? 0;

      const nw = Math.min(108, cellW - 16);
      const nh = Math.min(64, cellH - 20);
      const node = this.add.graphics();
      node.fillStyle(0x000000, 0.25);
      node.fillRoundedRect(x - nw / 2 + 3, y - nh / 2 + 4, nw, nh, 14);
      node.fillStyle(hex(unlocked ? theme.chipActive : theme.chipIdle), 1);
      node.fillRoundedRect(x - nw / 2, y - nh / 2, nw, nh, 14);
      node.lineStyle(2, hex(theme.panelBorder), unlocked ? 0.9 : 0.35);
      node.strokeRoundedRect(x - nw / 2, y - nh / 2, nw, nh, 14);

      this.add
        .text(x, y - 10, unlocked ? `${id}` : '🔒', {
          fontFamily: '"Fredoka", "Microsoft YaHei", sans-serif',
          fontSize: unlocked ? (id >= 100 ? '18px' : '22px') : '16px',
          fontStyle: '700',
          color: theme.buttonText,
        })
        .setOrigin(0.5);

      this.add
        .text(x, y + 12, unlocked ? levelDifficultyLabel(level) : '未解锁', {
          fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
          fontSize: '12px',
          fontStyle: '700',
          color: theme.buttonText,
        })
        .setOrigin(0.5)
        .setAlpha(0.85);

      if (unlocked && stars > 0) {
        this.add
          .text(x, y + nh / 2 + 10, '★'.repeat(stars) + '☆'.repeat(3 - stars), {
            fontFamily: '"Nunito", sans-serif',
            fontSize: '12px',
            color: theme.accent,
          })
          .setOrigin(0.5);
      }

      if (unlocked) {
        const hit = this.add
          .rectangle(x, y, nw, nh, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => node.setAlpha(0.88));
        hit.on('pointerout', () => node.setAlpha(1));
        hit.on('pointerdown', () => {
          sfx.click();
          const def = getLevel(id);
          if (!def) return;
          this.scene.start('Play', {
            mode: 'campaign',
            levelId: def.id,
            difficulty: def.difficulty,
            playerStone: Stone.Black,
            themeId: settings.themeId,
            aiDepth: def.depth,
            aiBlunderRate: def.blunderRate,
            aiRadius: def.radius,
          });
        });
      }
    }

    this.add
      .text(W / 2, H - 100, TOTAL_PAGES > 1 ? `第 ${this.page + 1} / ${TOTAL_PAGES} 页` : '难度由易到难', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        color: theme.muted,
      })
      .setOrigin(0.5);

    if (TOTAL_PAGES > 1) {
      makeButton(this, {
        x: W / 2 - 160,
        y: H - 52,
        w: 130,
        h: 44,
        label: '上一页',
        fontSize: 17,
        onClick: () => {
          if (this.page <= 0) return;
          sfx.click();
          this.scene.restart({ page: this.page - 1 });
        },
      });
    }

    makeButton(this, {
      x: W / 2,
      y: H - 52,
      w: 130,
      h: 44,
      label: '返回首页',
      fontSize: 17,
      onClick: () => {
        sfx.click();
        this.scene.start('Menu');
      },
    });

    if (TOTAL_PAGES > 1) {
      makeButton(this, {
        x: W / 2 + 160,
        y: H - 52,
        w: 130,
        h: 44,
        label: '下一页',
        fontSize: 17,
        onClick: () => {
          if (this.page >= TOTAL_PAGES - 1) return;
          sfx.click();
          this.scene.restart({ page: this.page + 1 });
        },
      });
    }
  }
}
