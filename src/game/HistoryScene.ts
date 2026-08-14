import Phaser from 'phaser';
import {
  DIFFICULTY_LABELS,
  GameResult,
  Stone,
} from '../core/constants';
import { getTheme, setTheme } from '../art/themes';
import { bakeThemeTextures } from '../art/textures';
import { getSfx } from '../audio/sfx';
import { recordsRepo } from '../storage/records';
import { settingsRepo } from '../storage/settings';
import { drawPanel, fillBackground, makeButton, titleText } from '../ui/widgets';

function resultText(
  result: GameResult,
  playerStone: Stone.Black | Stone.White,
): string {
  if (result === GameResult.Draw) return '和';
  const won =
    (result === GameResult.BlackWin && playerStone === Stone.Black) ||
    (result === GameResult.WhiteWin && playerStone === Stone.White);
  return won ? '胜' : '负';
}

export class HistoryScene extends Phaser.Scene {
  constructor() {
    super('History');
  }

  create(): void {
    const settings = settingsRepo.load();
    setTheme(settings.themeId);
    bakeThemeTextures(this);
    const theme = getTheme();
    const sfx = getSfx(settings.volume);
    fillBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;

    titleText(this, W / 2, 48, '历史对局', 40);

    const records = recordsRepo.list();
    const startY = 110;
    const panelW = Math.min(760, W - 40);
    records.slice(0, 10).forEach((r, i) => {
      const y = startY + i * 52;
      const date = new Date(r.createdAt);
      const label = `${date.toLocaleString()} · ${DIFFICULTY_LABELS[r.difficulty]} · ${resultText(
        r.result,
        r.playerStone,
      )} · ${r.moves.length}手`;
      drawPanel(this, W / 2, y, panelW, 46);
      this.add
        .text(W / 2 - panelW / 2 + 18, y, label, {
          fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
          fontSize: '16px',
          color: theme.text,
        })
        .setOrigin(0, 0.5);
      makeButton(this, {
        x: W / 2 + panelW / 2 - 60,
        y,
        w: 100,
        h: 32,
        label: '复盘',
        fontSize: 15,
        onClick: () => {
          sfx.click();
          this.scene.start('Replay', {
            moves: r.moves,
            result: r.result,
            playerStone: r.playerStone,
            difficulty: r.difficulty,
            themeId: r.themeId,
            recordId: r.id,
          });
        },
      });
    });

    if (records.length === 0) {
      this.add
        .text(W / 2, H / 2, '还没有对局记录', {
          fontFamily: '"Noto Serif SC", serif',
          fontSize: '24px',
          color: theme.muted,
        })
        .setOrigin(0.5);
    }

    makeButton(this, {
      x: W / 2,
      y: H - 60,
      w: 200,
      h: 48,
      label: '返回首页',
      onClick: () => {
        sfx.click();
        this.scene.start('Menu');
      },
    });
  }
}
