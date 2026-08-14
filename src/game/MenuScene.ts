import Phaser from 'phaser';
import {
  DIFFICULTY_LABELS,
  Difficulty,
  Stone,
  STORAGE_VERSION,
} from '../core/constants';
import { bakeThemeTextures, stoneTextureKey } from '../art/textures';
import { getAllThemes, getTheme, setTheme } from '../art/themes';
import { getSfx } from '../audio/sfx';
import { recordsRepo } from '../storage/records';
import { settingsRepo } from '../storage/settings';
import {
  drawThemeSwatch,
  fillBackground,
  hex,
  makeButton,
  titleText,
} from '../ui/widgets';

interface MenuBoot {
  openSettings?: boolean;
}

/**
 * Home lobby only (图二): title + summary + 开玩 / 设置.
 * Board appears only after starting PlayScene (图三).
 */
export class MenuScene extends Phaser.Scene {
  private openSettingsOnBoot = false;

  constructor() {
    super('Menu');
  }

  init(data: MenuBoot): void {
    this.openSettingsOnBoot = Boolean(data?.openSettings);
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

    let difficulty = settings.difficulty;
    let playerStone: Stone.Black | Stone.White = settings.playerStone;
    let themeId = settings.themeId;
    let volume = settings.volume;

    const persist = () => {
      settingsRepo.save({
        version: STORAGE_VERSION,
        themeId,
        difficulty,
        playerStone,
        volume,
      });
    };

    // —— Centered lobby card (图二) ——
    const cx = W / 2;
    const cy = H / 2;
    const cardW = 420;
    const cardH = 660;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(cx - cardW / 2 + 6, cy - cardH / 2 + 8, cardW, cardH, 28);
    g.fillStyle(hex(theme.panel), 1);
    g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 28);
    g.lineStyle(3, hex(theme.panelBorder), 1);
    g.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 28);
    g.lineStyle(2, hex(theme.panelHighlight), 0.35);
    g.strokeRoundedRect(cx - cardW / 2 + 8, cy - cardH / 2 + 8, cardW - 16, cardH - 16, 22);

    titleText(this, cx, cy - 250, '五子棋', 56);
    this.add
      .text(cx, cy - 198, theme.tagline, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        color: theme.muted,
      })
      .setOrigin(0.5);

    const summary = this.add
      .text(cx, cy - 120, '', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        fontStyle: '700',
        color: theme.text,
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5);

    const refreshSummary = () => {
      const t = getTheme();
      const side = playerStone === Stone.Black ? t.blackName : t.whiteName;
      summary.setText(
        `${t.label}\n难度：${DIFFICULTY_LABELS[difficulty]}\n阵营：${side}`,
      );
    };
    refreshSummary();

    this.add.image(cx - 48, cy - 20, stoneTextureKey(true, theme)).setDisplaySize(52, 52);
    this.add.image(cx + 48, cy - 20, stoneTextureKey(false, theme)).setDisplaySize(52, 52);
    this.add
      .text(cx, cy + 28, `${theme.blackName}  vs  ${theme.whiteName}`, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        fontStyle: '700',
        color: theme.muted,
      })
      .setOrigin(0.5);

    makeButton(this, {
      x: cx,
      y: cy + 95,
      w: 300,
      h: 54,
      label: '闯关模式',
      fontSize: 24,
      primary: true,
      onClick: () => {
        sfx.click();
        persist();
        setTheme(themeId);
        this.scene.start('Map');
      },
    });

    makeButton(this, {
      x: cx,
      y: cy + 160,
      w: 300,
      h: 48,
      label: '自由对战',
      fontSize: 20,
      onClick: () => {
        sfx.click();
        persist();
        setTheme(themeId);
        this.scene.start('Play', {
          mode: 'free',
          difficulty,
          playerStone,
          themeId,
        });
      },
    });

    makeButton(this, {
      x: cx,
      y: cy + 218,
      w: 300,
      h: 44,
      label: '游戏设置',
      fontSize: 18,
      onClick: () => {
        sfx.click();
        openSettings();
      },
    });

    const hasRecords = recordsRepo.list().length > 0;
    makeButton(this, {
      x: cx - 85,
      y: cy + 280,
      w: 150,
      h: 40,
      label: hasRecords ? '历史对局' : '暂无记录',
      fontSize: 15,
      onClick: () => {
        if (!hasRecords) return;
        sfx.click();
        persist();
        this.scene.start('History');
      },
    });

    makeButton(this, {
      x: cx + 85,
      y: cy + 280,
      w: 150,
      h: 40,
      label: volume <= 0.01 ? '音效：关' : '音效：开',
      fontSize: 15,
      onClick: () => {
        volume = volume <= 0.01 ? 0.7 : 0;
        sfx.setVolume(volume);
        if (volume > 0) sfx.click();
        persist();
        this.scene.restart({ openSettings: false });
      },
    });

    // —— Settings overlay ——
    const overlay = this.add.container(0, 0).setDepth(100).setVisible(false);
    const dim = this.add
      .rectangle(W / 2, H / 2, W, H, 0x000000, 0.55)
      .setInteractive();
    overlay.add(dim);

    const panelRoot = this.add.container(W / 2, H / 2);
    overlay.add(panelRoot);
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x000000, 0.35);
    panelGfx.fillRoundedRect(-290 + 6, -300 + 8, 580, 600, 24);
    panelGfx.fillStyle(hex(theme.panel), 1);
    panelGfx.fillRoundedRect(-290, -300, 580, 600, 24);
    panelGfx.lineStyle(3, hex(theme.panelBorder), 1);
    panelGfx.strokeRoundedRect(-290, -300, 580, 600, 24);
    panelRoot.add(panelGfx);

    panelRoot.add(
      this.add
        .text(0, -268, '游戏设置', {
          fontFamily: '"Fredoka", "Microsoft YaHei", sans-serif',
          fontSize: '32px',
          fontStyle: '700',
          color: theme.text,
          stroke: theme.panelBorder,
          strokeThickness: 3,
        })
        .setOrigin(0.5),
    );

    const blocker = this.add.rectangle(0, 0, 580, 600, 0x000000, 0.001).setInteractive();
    panelRoot.add(blocker);
    blocker.setDepth(-1);

    const live: Phaser.GameObjects.GameObject[] = [];
    const clearLive = () => {
      while (live.length) live.pop()?.destroy();
    };

    const rebuildSettingsBody = () => {
      clearLive();
      const t = getTheme();
      const add = (obj: Phaser.GameObjects.GameObject) => {
        live.push(obj);
        panelRoot.add(obj);
      };

      add(
        this.add
          .text(0, -220, '选难度', {
            fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            fontStyle: '700',
            color: t.muted,
          })
          .setOrigin(0.5),
      );

      [Difficulty.Easy, Difficulty.Medium, Difficulty.Hard].forEach((d, i) => {
        add(
          makeButton(this, {
            x: -140 + i * 140,
            y: -175,
            w: 120,
            h: 40,
            label: DIFFICULTY_LABELS[d],
            fontSize: 17,
            active: d === difficulty,
            onClick: () => {
              sfx.click();
              difficulty = d;
              persist();
              refreshSummary();
              rebuildSettingsBody();
            },
          }),
        );
      });

      add(
        this.add
          .text(0, -120, '选阵营', {
            fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            fontStyle: '700',
            color: t.muted,
          })
          .setOrigin(0.5),
      );

      add(
        makeButton(this, {
          x: -100,
          y: -75,
          w: 170,
          h: 40,
          label: `${t.blackName} · 先手`,
          fontSize: 15,
          active: playerStone === Stone.Black,
          onClick: () => {
            sfx.click();
            playerStone = Stone.Black;
            persist();
            refreshSummary();
            rebuildSettingsBody();
          },
        }),
      );
      add(
        makeButton(this, {
          x: 100,
          y: -75,
          w: 170,
          h: 40,
          label: `${t.whiteName} · 后手`,
          fontSize: 15,
          active: playerStone === Stone.White,
          onClick: () => {
            sfx.click();
            playerStone = Stone.White;
            persist();
            refreshSummary();
            rebuildSettingsBody();
          },
        }),
      );

      add(
        this.add
          .text(0, -20, '换皮肤', {
            fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            fontStyle: '700',
            color: t.muted,
          })
          .setOrigin(0.5),
      );

      getAllThemes().forEach((th, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const sx = -90 + col * 180;
        const sy = 70 + row * 105;
        add(drawThemeSwatch(this, sx, sy, th, th.id === themeId));
        const hit = this.add
          .rectangle(sx, sy, 118, 92, 0x000000, 0.001)
          .setInteractive({ useHandCursor: true });
        add(hit);
        hit.on('pointerdown', () => {
          if (th.id === themeId) return;
          sfx.click();
          themeId = th.id;
          persist();
          setTheme(themeId);
          this.scene.restart({ openSettings: true });
        });
      });

      add(
        makeButton(this, {
          x: 0,
          y: 250,
          w: 220,
          h: 48,
          label: '完成',
          fontSize: 20,
          primary: true,
          onClick: () => {
            sfx.click();
            persist();
            closeSettings();
          },
        }),
      );
    };

    const openSettings = () => {
      overlay.setVisible(true);
      rebuildSettingsBody();
    };
    const closeSettings = () => {
      clearLive();
      overlay.setVisible(false);
      refreshSummary();
    };

    dim.on('pointerdown', () => {
      sfx.click();
      closeSettings();
    });

    if (this.openSettingsOnBoot) openSettings();
  }
}
