import Phaser from 'phaser';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  GameResult,
  Stone,
  ThemeId,
  TOTAL_LEVELS,
} from '../core/constants';
import type { CellPos, PlayMode } from '../core/types';
import { getTheme, setTheme } from '../art/themes';
import { bakeThemeTextures } from '../art/textures';
import { getSfx } from '../audio/sfx';
import { getLevel } from '../data/levels';
import { getTitleByLevel } from '../data/titles';
import { settingsRepo } from '../storage/settings';
import { drawPanel, fillBackground, makeButton, titleText } from '../ui/widgets';

export interface ResultData {
  result: GameResult;
  playerStone: Stone.Black | Stone.White;
  difficulty: Difficulty;
  themeId: ThemeId;
  moves: CellPos[];
  recordId?: string;
  mode?: PlayMode;
  levelId?: number;
  stars?: number;
  /** Milestone level that just awarded a new title. */
  newTitleLevelId?: number;
  /** True when campaign progress failed to persist. */
  progressSaveFailed?: boolean;
  aiDepth?: number;
  aiBlunderRate?: number;
  aiRadius?: number;
}

export class ResultScene extends Phaser.Scene {
  private payload!: ResultData;

  constructor() {
    super('Result');
  }

  init(data: ResultData): void {
    this.payload = data;
  }

  create(): void {
    setTheme(this.payload.themeId);
    bakeThemeTextures(this);
    const theme = getTheme();
    const sfx = getSfx(settingsRepo.load().volume);
    fillBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const campaign = this.payload.mode === 'campaign';
    const playerWon = this.isPlayerWin(this.payload.result);
    const titleAward = this.payload.newTitleLevelId
      ? getTitleByLevel(this.payload.newTitleLevelId)
      : null;
    const milestone = Boolean(campaign && playerWon && titleAward);
    const saveFailed = Boolean(this.payload.progressSaveFailed);

    drawPanel(this, W / 2, H / 2, milestone ? 560 : 520, milestone ? 540 : campaign ? 440 : 380);

    const title = this.titleFor(this.payload.result, milestone);
    titleText(
      this,
      W / 2,
      H / 2 - (milestone ? 210 : campaign ? 140 : 100),
      title,
      milestone ? 42 : 48,
    ).setColor(theme.accent);

    const levelLine =
      campaign && this.payload.levelId
        ? `第 ${this.payload.levelId} 关 · 共 ${this.payload.moves.length} 手`
        : `${DIFFICULTY_LABELS[this.payload.difficulty]} · 共 ${this.payload.moves.length} 手`;

    this.add
      .text(W / 2, H / 2 - (milestone ? 155 : campaign ? 70 : 30), levelLine, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        color: theme.text,
      })
      .setOrigin(0.5);

    if (campaign && playerWon) {
      const stars = this.payload.stars ?? 1;
      this.add
        .text(W / 2, H / 2 - (milestone ? 115 : 30), '★'.repeat(stars) + '☆'.repeat(3 - stars), {
          fontFamily: '"Nunito", sans-serif',
          fontSize: '28px',
          color: theme.accent,
        })
        .setOrigin(0.5);
    }

    if (milestone && titleAward) {
      this.add
        .text(W / 2, H / 2 - 60, `获得称号「${titleAward.title}」`, {
          fontFamily: '"Fredoka", "Microsoft YaHei", sans-serif',
          fontSize: '28px',
          fontStyle: '700',
          color: theme.accent,
        })
        .setOrigin(0.5);

      this.add
        .text(W / 2, H / 2 + 5, titleAward.message, {
          fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
          fontSize: '16px',
          fontStyle: '700',
          color: theme.text,
          align: 'center',
          wordWrap: { width: 460 },
          lineSpacing: 8,
        })
        .setOrigin(0.5);
    }

    if (saveFailed) {
      this.add
        .text(W / 2, H / 2 + (milestone ? 70 : 20), '进度未能保存，请检查浏览器存储后重试', {
          fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
          fontSize: '14px',
          fontStyle: '700',
          color: '#ff6b6b',
        })
        .setOrigin(0.5);
    }

    const btnYPrimary = milestone ? H / 2 + 120 : H / 2 + 55;
    const btnYSecondary = milestone ? H / 2 + 190 : H / 2 + 125;

    if (
      campaign &&
      playerWon &&
      this.payload.levelId &&
      this.payload.levelId < TOTAL_LEVELS &&
      !saveFailed
    ) {
      makeButton(this, {
        x: W / 2,
        y: btnYPrimary,
        w: 240,
        h: 50,
        label: '下一关',
        fontSize: 22,
        primary: true,
        onClick: () => {
          sfx.click();
          const nextId = (this.payload.levelId ?? 1) + 1;
          const def = getLevel(nextId);
          if (!def) {
            this.scene.start('Map');
            return;
          }
          this.scene.start('Play', {
            mode: 'campaign',
            levelId: def.id,
            difficulty: def.difficulty,
            playerStone: Stone.Black,
            themeId: this.payload.themeId,
            aiDepth: def.depth,
            aiBlunderRate: def.blunderRate,
            aiRadius: def.radius,
          });
        },
      });

      makeButton(this, {
        x: W / 2 - 110,
        y: btnYSecondary,
        w: 180,
        h: 44,
        label: '再试一次',
        fontSize: 18,
        onClick: () => this.retry(sfx),
      });

      makeButton(this, {
        x: W / 2 + 110,
        y: btnYSecondary,
        w: 180,
        h: 44,
        label: '闯关地图',
        fontSize: 18,
        onClick: () => {
          sfx.click();
          this.scene.start('Map');
        },
      });
    } else if (campaign) {
      makeButton(this, {
        x: W / 2 - 110,
        y: H / 2 + (milestone ? 120 : 60),
        w: 180,
        h: 48,
        label: playerWon ? '闯关地图' : '再试一次',
        primary: true,
        onClick: () => {
          sfx.click();
          if (playerWon) this.scene.start('Map');
          else this.retry(sfx);
        },
      });

      makeButton(this, {
        x: W / 2 + 110,
        y: H / 2 + (milestone ? 120 : 60),
        w: 180,
        h: 48,
        label: playerWon ? '返回首页' : '闯关地图',
        onClick: () => {
          sfx.click();
          this.scene.start(playerWon ? 'Menu' : 'Map');
        },
      });

      if (!playerWon) {
        makeButton(this, {
          x: W / 2,
          y: H / 2 + 130,
          w: 200,
          h: 44,
          label: '返回首页',
          fontSize: 18,
          onClick: () => {
            sfx.click();
            this.scene.start('Menu');
          },
        });
      }
    } else {
      makeButton(this, {
        x: W / 2 - 110,
        y: H / 2 + 60,
        w: 180,
        h: 48,
        label: '再来一局',
        onClick: () => {
          sfx.click();
          this.scene.start('Play', {
            mode: 'free',
            difficulty: this.payload.difficulty,
            playerStone: this.payload.playerStone,
            themeId: this.payload.themeId,
          });
        },
      });

      makeButton(this, {
        x: W / 2 + 110,
        y: H / 2 + 60,
        w: 180,
        h: 48,
        label: '复盘',
        onClick: () => {
          sfx.click();
          this.scene.start('Replay', {
            moves: this.payload.moves,
            result: this.payload.result,
            playerStone: this.payload.playerStone,
            difficulty: this.payload.difficulty,
            themeId: this.payload.themeId,
            recordId: this.payload.recordId,
          });
        },
      });

      makeButton(this, {
        x: W / 2,
        y: H / 2 + 130,
        w: 200,
        h: 44,
        label: '返回首页',
        fontSize: 20,
        onClick: () => {
          sfx.click();
          this.scene.start('Menu');
        },
      });
    }
  }

  private retry(sfx: { click: () => void }): void {
    sfx.click();
    if (this.payload.mode === 'campaign' && this.payload.levelId) {
      const def = getLevel(this.payload.levelId);
      if (!def) {
        this.scene.start('Map');
        return;
      }
      this.scene.start('Play', {
        mode: 'campaign',
        levelId: def.id,
        difficulty: def.difficulty,
        playerStone: Stone.Black,
        themeId: this.payload.themeId,
        aiDepth: def.depth,
        aiBlunderRate: def.blunderRate,
        aiRadius: def.radius,
      });
      return;
    }
    this.scene.start('Play', {
      mode: 'free',
      difficulty: this.payload.difficulty,
      playerStone: this.payload.playerStone,
      themeId: this.payload.themeId,
    });
  }

  private isPlayerWin(r: GameResult): boolean {
    return (
      (r === GameResult.BlackWin && this.payload.playerStone === Stone.Black) ||
      (r === GameResult.WhiteWin && this.payload.playerStone === Stone.White)
    );
  }

  private titleFor(r: GameResult, milestone: boolean): string {
    if (r === GameResult.Draw) return '和棋';
    if (this.payload.mode === 'campaign' && this.isPlayerWin(r) && this.payload.levelId === TOTAL_LEVELS) {
      return '通关！';
    }
    if (milestone && this.isPlayerWin(r)) return '阶段达成！';
    return this.isPlayerWin(r) ? '胜利' : '惜败';
  }
}
