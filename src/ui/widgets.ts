import Phaser from 'phaser';
import { getTheme, type ThemePalette } from '../art/themes';

export function hex(color: string): number {
  if (color.startsWith('rgba') || color.startsWith('rgb')) {
    const m = color.match(/[\d.]+/g);
    if (!m || m.length < 3) return 0;
    return Phaser.Display.Color.GetColor(Number(m[0]), Number(m[1]), Number(m[2]));
  }
  return Phaser.Display.Color.HexStringToColor(color).color;
}

export interface BtnOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fontSize?: number;
  primary?: boolean;
  active?: boolean;
  onClick: () => void;
}

/** Bubble / sparkle playground backdrop. */
export function fillBackground(scene: Phaser.Scene): void {
  const theme = getTheme();
  const W = scene.scale.width;
  const H = scene.scale.height;
  const g = scene.add.graphics();

  g.fillGradientStyle(hex(theme.bgTop), hex(theme.bgTop), hex(theme.bgBottom), hex(theme.bgBottom), 1);
  g.fillRect(0, 0, W, H);

  // Soft color blobs (match-3 vibe)
  g.fillStyle(hex(theme.accent), 0.12);
  g.fillCircle(W * 0.18, H * 0.2, 140);
  g.fillStyle(hex(theme.panelBorder), 0.1);
  g.fillCircle(W * 0.82, H * 0.28, 120);
  g.fillStyle(hex(theme.button), 0.08);
  g.fillCircle(W * 0.55, H * 0.85, 160);

  // Floating sparkles / dots
  for (let i = 0; i < 24; i += 1) {
    const x = ((i * 97) % W) + 20;
    const y = ((i * 53) % H) + 10;
    g.fillStyle(0xffffff, 0.08 + (i % 3) * 0.04);
    g.fillCircle(x, y, 2 + (i % 4));
  }
}

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
): Phaser.GameObjects.Container {
  const theme = getTheme();
  const g = scene.add.graphics();
  const hw = w / 2;
  const hh = h / 2;

  g.fillStyle(0x000000, 0.28);
  g.fillRoundedRect(-hw + 5, -hh + 7, w, h, 22);

  g.fillStyle(hex(theme.panel), 1);
  g.fillRoundedRect(-hw, -hh, w, h, 22);
  g.lineStyle(3, hex(theme.panelBorder), 0.95);
  g.strokeRoundedRect(-hw, -hh, w, h, 22);
  g.lineStyle(2, hex(theme.panelHighlight), 0.35);
  g.strokeRoundedRect(-hw + 6, -hh + 6, w - 12, h - 12, 16);

  // Candy shine strip
  g.fillStyle(0xffffff, 0.08);
  g.fillRoundedRect(-hw + 10, -hh + 10, w - 20, 22, 10);

  return scene.add.container(x, y, [g]);
}

export function makeButton(scene: Phaser.Scene, opts: BtnOpts): Phaser.GameObjects.Container {
  const theme = getTheme();
  const primary = opts.primary ?? false;
  const active = opts.active ?? false;
  const g = scene.add.graphics();
  const hw = opts.w / 2;
  const hh = opts.h / 2;
  const fill = active ? theme.chipActive : primary ? theme.button : theme.chipIdle;
  const dark = theme.buttonDark;

  g.fillStyle(hex(dark), 1);
  g.fillRoundedRect(-hw, -hh + 3, opts.w, opts.h, 16);
  g.fillStyle(hex(fill), 1);
  g.fillRoundedRect(-hw, -hh, opts.w, opts.h - 3, 16);
  g.lineStyle(2, hex(theme.panelBorder), primary || active ? 0.85 : 0.35);
  g.strokeRoundedRect(-hw, -hh, opts.w, opts.h - 3, 16);
  g.fillStyle(0xffffff, 0.18);
  g.fillRoundedRect(-hw + 6, -hh + 4, opts.w - 12, Math.max(8, opts.h * 0.28), 8);

  const text = scene.add
    .text(0, -1, opts.label, {
      fontFamily: '"Nunito", "Noto Serif SC", "Microsoft YaHei", sans-serif',
      fontSize: `${opts.fontSize ?? 20}px`,
      fontStyle: '700',
      color: theme.buttonText,
    })
    .setOrigin(0.5);

  const hit = scene.add
    .rectangle(0, 0, opts.w, opts.h, 0x000000, 0.001)
    .setInteractive({ useHandCursor: true });
  const c = scene.add.container(opts.x, opts.y, [g, text, hit]);
  c.setSize(opts.w, opts.h);
  hit.on('pointerover', () => c.setScale(1.05));
  hit.on('pointerout', () => c.setScale(1));
  hit.on('pointerdown', () => opts.onClick());
  return c;
}

export function sectionLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
): Phaser.GameObjects.Text {
  const theme = getTheme();
  return scene.add
    .text(x, y, text, {
      fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
      fontSize: '15px',
      fontStyle: '700',
      color: theme.muted,
    })
    .setOrigin(0.5);
}

export function titleText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 56,
): Phaser.GameObjects.Text {
  const theme = getTheme();
  return scene.add
    .text(x, y, text, {
      fontFamily: '"Fredoka", "ZCOOL XiaoWei", "Microsoft YaHei", sans-serif',
      fontSize: `${size}px`,
      fontStyle: '700',
      color: theme.text,
      stroke: theme.panelBorder,
      strokeThickness: 4,
    })
    .setOrigin(0.5);
}

export function drawThemeSwatch(
  scene: Phaser.Scene,
  x: number,
  y: number,
  theme: ThemePalette,
  selected: boolean,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const w = 118;
  const h = 92;
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(-w / 2 + 3, -h / 2 + 4, w, h, 14);
  g.fillStyle(hex(theme.panel), 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
  g.lineStyle(selected ? 3 : 2, hex(selected ? theme.accent : theme.panelBorder), selected ? 1 : 0.45);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);

  // Mini playful board
  g.fillStyle(hex(theme.boardDark), 1);
  g.fillRoundedRect(-38, -30, 76, 48, 8);
  g.fillStyle(hex(theme.boardLight), 0.7);
  g.fillRoundedRect(-34, -26, 20, 20, 4);
  g.fillRoundedRect(-10, -6, 20, 20, 4);
  g.fillRoundedRect(14, -26, 20, 20, 4);

  // Two cartoon stone dots
  g.fillStyle(hex(theme.blackStone), 1);
  g.fillCircle(-12, -8, 8);
  g.fillStyle(hex(theme.whiteStone), 1);
  g.fillCircle(14, 4, 8);
  g.lineStyle(1.5, 0x12162a, 0.8);
  g.strokeCircle(-12, -8, 8);
  g.strokeCircle(14, 4, 8);

  const label = scene.add
    .text(0, 32, theme.label, {
      fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
      fontSize: '13px',
      fontStyle: '700',
      color: theme.text,
    })
    .setOrigin(0.5);

  return scene.add.container(x, y, [g, label]);
}
