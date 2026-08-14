import Phaser from 'phaser';
import {
  BOARD_SIZE,
  DIFFICULTY_LABELS,
  Difficulty,
  GameResult,
  Stone,
  ThemeId,
} from '../core/constants';
import type { CellPos } from '../core/types';
import { GomokuGame } from '../core/game';
import { bakeThemeTextures, stoneTextureKey, TEX } from '../art/textures';
import { getTheme, setTheme } from '../art/themes';
import { getSfx } from '../audio/sfx';
import { settingsRepo } from '../storage/settings';
import { fillBackground, hex, makeButton, titleText } from '../ui/widgets';
import { computeBoardLayout, PLAY_FOOTER_H, PLAY_HEADER_H } from '../ui/boardLayout';

export interface ReplayData {
  moves: CellPos[];
  result: GameResult;
  playerStone: Stone.Black | Stone.White;
  difficulty: Difficulty;
  themeId: ThemeId;
  recordId?: string;
}

export class ReplayScene extends Phaser.Scene {
  private payload!: ReplayData;
  private step = 0;
  private cell = 40;
  private stoneSize = 36;
  private originX = 0;
  private originY = 0;
  private boardRoot!: Phaser.GameObjects.Container;
  private stepText!: Phaser.GameObjects.Text;

  constructor() {
    super('Replay');
  }

  init(data: ReplayData): void {
    this.payload = data;
    this.step = data.moves.length;
  }

  create(): void {
    setTheme(this.payload.themeId);
    bakeThemeTextures(this);
    const theme = getTheme();
    const sfx = getSfx(settingsRepo.load().volume);
    fillBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const layout = computeBoardLayout(W, H);
    this.cell = layout.cell;
    this.stoneSize = layout.stoneSize;
    const boardVisual = layout.boardVisual;
    this.originX = layout.originX;
    this.originY = layout.originY;

    // Header
    const hg = this.add.graphics();
    hg.fillStyle(hex(theme.panel), 0.92);
    hg.fillRoundedRect(14, 10, W - 28, PLAY_HEADER_H - 16, 20);
    hg.lineStyle(2, hex(theme.panelBorder), 0.7);
    hg.strokeRoundedRect(14, 10, W - 28, PLAY_HEADER_H - 16, 20);
    titleText(this, W / 2, 40, '复盘', 30);
    this.add
      .text(W / 2, 72, DIFFICULTY_LABELS[this.payload.difficulty], {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        fontStyle: '700',
        color: theme.muted,
      })
      .setOrigin(0.5);
    this.stepText = this.add
      .text(W / 2, 96, '', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        color: theme.accent,
      })
      .setOrigin(0.5);

    this.boardRoot = this.add.container(this.originX, this.originY);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(12, 16, boardVisual, boardVisual, 10);
    this.boardRoot.add(shadow);
    this.boardRoot.add(
      this.add.image(boardVisual / 2, boardVisual / 2, TEX.board).setDisplaySize(boardVisual, boardVisual),
    );
    this.drawGrid(boardVisual);

    // Footer controls
    const fg = this.add.graphics();
    fg.fillStyle(hex(theme.panel), 0.92);
    fg.fillRoundedRect(14, H - PLAY_FOOTER_H + 6, W - 28, PLAY_FOOTER_H - 18, 22);
    fg.lineStyle(2, hex(theme.panelBorder), 0.7);
    fg.strokeRoundedRect(14, H - PLAY_FOOTER_H + 6, W - 28, PLAY_FOOTER_H - 18, 22);

    const labels = ['开头', '上一步', '下一步', '结局', '返回'] as const;
    const count = labels.length;
    const btnW = Math.min(118, (W - 48) / count - 10);
    const span = count * (btnW + 10) - 10;
    const startX = (W - span) / 2 + btnW / 2;
    const y = layout.footerY;
    const actions = [
      () => {
        sfx.click();
        this.step = 0;
        this.renderStep();
      },
      () => {
        sfx.click();
        this.step = Math.max(0, this.step - 1);
        this.renderStep();
      },
      () => {
        sfx.click();
        this.step = Math.min(this.payload.moves.length, this.step + 1);
        this.renderStep();
      },
      () => {
        sfx.click();
        this.step = this.payload.moves.length;
        this.renderStep();
      },
      () => {
        sfx.click();
        this.scene.start('Menu');
      },
    ];
    labels.forEach((label, i) => {
      makeButton(this, {
        x: startX + i * (btnW + 10),
        y,
        w: btnW,
        h: 52,
        label,
        fontSize: 16,
        onClick: actions[i]!,
      });
    });

    this.renderStep();
  }

  private drawGrid(boardVisual: number): void {
    const theme = getTheme();
    const g = this.add.graphics();
    const lineW = Math.max(2, this.cell * 0.045);
    g.lineStyle(lineW, hex(theme.grid), 0.7);
    for (let i = 0; i < BOARD_SIZE; i += 1) {
      const p = this.cell * (i + 1);
      g.lineBetween(this.cell, p, boardVisual - this.cell, p);
      g.lineBetween(p, this.cell, p, boardVisual - this.cell);
    }
    this.boardRoot.add(g);
  }

  private renderStep(): void {
    while (this.boardRoot.length > 3) {
      this.boardRoot.getAt(this.boardRoot.length - 1).destroy();
    }

    const slice = this.payload.moves.slice(0, this.step);
    const g = GomokuGame.fromMoves(slice);
    const theme = getTheme();
    for (const m of g.getMoves()) {
      const x = this.cell * (m.col + 1);
      const y = this.cell * (m.row + 1);
      const key = stoneTextureKey(m.stone === Stone.Black, theme);
      this.boardRoot.add(
        this.add.image(x, y, key).setDisplaySize(this.stoneSize, this.stoneSize),
      );
    }
    const line = g.getWinningLine();
    if (line) {
      for (const p of line) {
        const x = this.cell * (p.col + 1);
        const y = this.cell * (p.row + 1);
        this.boardRoot.add(
          this.add.circle(x, y, this.cell * 0.42).setStrokeStyle(3, hex(theme.winGlow)),
        );
      }
    }
    this.stepText.setText(`第 ${this.step} / ${this.payload.moves.length} 手`);
  }
}
