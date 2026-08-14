import type Phaser from 'phaser';
import { ThemeId } from '../core/constants';
import { getTheme, type ThemePalette } from './themes';

export const TEX = {
  board: 'tex_board',
  black: 'tex_black',
  white: 'tex_white',
  blackChar: 'tex_black_char',
  whiteChar: 'tex_white_char',
} as const;

function css(hex: string, a = 1): string {
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 0xff;
    const g = (n >> 8) & 0xff;
    const b = n & 0xff;
    return `rgba(${r},${g},${b},${a})`;
  }
  return hex;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Soft checkered playground like a match-3 stage. */
function drawPlayBoard(ctx: CanvasRenderingContext2D, size: number, theme: ThemePalette): void {
  const edge = size * 0.035;
  // Outer colorful frame
  const frame = ctx.createLinearGradient(0, 0, size, size);
  frame.addColorStop(0, theme.boardEdge);
  frame.addColorStop(0.5, theme.accent);
  frame.addColorStop(1, theme.boardEdge);
  ctx.fillStyle = frame;
  roundRect(ctx, 0, 0, size, size, size * 0.04);
  ctx.fill();

  // Inner stage
  roundRect(ctx, edge, edge, size - edge * 2, size - edge * 2, size * 0.03);
  ctx.fillStyle = theme.boardDark;
  ctx.fill();

  // Checker cells
  const pad = edge + size * 0.02;
  const inner = size - pad * 2;
  const cells = 8;
  const cw = inner / cells;
  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      ctx.fillStyle = (r + c) % 2 === 0 ? theme.boardLight : theme.boardDark;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(pad + c * cw, pad + r * cw, cw + 0.5, cw + 0.5);
    }
  }
  ctx.globalAlpha = 1;

  // Soft gloss
  const gloss = ctx.createLinearGradient(0, edge, 0, size * 0.4);
  gloss.addColorStop(0, 'rgba(255,255,255,0.22)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  roundRect(ctx, edge, edge, size - edge * 2, size * 0.28, size * 0.03);
  ctx.fill();

  // Theme décor dots
  if (theme.boardMaterial === 'candy') {
    for (let i = 0; i < 18; i += 1) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,140,200,0.35)' : 'rgba(255,220,120,0.3)';
      ctx.beginPath();
      ctx.arc(
        edge + 20 + ((i * 97) % (size - edge * 2 - 40)),
        edge + 16 + ((i * 53) % 30),
        3 + (i % 3),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  } else if (theme.boardMaterial === 'garden') {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 10; i += 1) {
      const x = edge + 30 + i * 60;
      ctx.beginPath();
      ctx.ellipse(x, edge + 18, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.boardMaterial === 'digi') {
    ctx.strokeStyle = 'rgba(46,232,160,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      ctx.strokeRect(edge + 12 + i * 8, edge + 12 + i * 8, size - edge * 2 - 24 - i * 16, size - edge * 2 - 24 - i * 16);
    }
  } else if (theme.boardMaterial === 'ultra') {
    ctx.strokeStyle = 'rgba(255,58,78,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(170,200,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function toonStroke(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = 'rgba(18,22,42,0.95)';
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function eyePair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  dx = 8,
): void {
  for (const d of [-dx, dx]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx + d, cy, 3.2, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(cx + d, cy + 0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(cx + d - 1, cy - 1.5, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Agumon-like orange dino (black / player side in digimon). */
function drawAgumon(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size / 64;
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.moveTo(cx - 16, cy + 4);
  ctx.quadraticCurveTo(cx - 18, cy - 12, cx - 6, cy - 16);
  ctx.quadraticCurveTo(cx, cy - 18, cx + 6, cy - 16);
  ctx.quadraticCurveTo(cx + 18, cy - 12, cx + 16, cy + 4);
  ctx.quadraticCurveTo(cx + 15, cy + 15, cx, cy + 16);
  ctx.quadraticCurveTo(cx - 15, cy + 15, cx - 16, cy + 4);
  ctx.closePath();
  ctx.fillStyle = '#ffa030';
  ctx.fill();
  // highlight
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,208,144,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 10, 14, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  toonStroke(ctx);
  eyePair(ctx, cx, cy - 5, '#50b45a');
  ctx.strokeStyle = '#c86a08';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy + 8);
  ctx.quadraticCurveTo(cx, cy + 13, cx + 11, cy + 8);
  ctx.stroke();
  ctx.restore();
}

/** Koromon-like pink blob. */
function drawKoromon(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size / 64;
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.moveTo(cx - 15, cy + 7);
  ctx.quadraticCurveTo(cx - 18, cy - 5, cx - 10, cy - 10);
  ctx.lineTo(cx - 15, cy - 20);
  ctx.quadraticCurveTo(cx - 4, cy - 14, cx - 1, cy - 11);
  ctx.quadraticCurveTo(cx + 2, cy - 14, cx + 13, cy - 20);
  ctx.lineTo(cx + 10, cy - 10);
  ctx.quadraticCurveTo(cx + 18, cy - 5, cx + 15, cy + 7);
  ctx.quadraticCurveTo(cx + 10, cy + 16, cx, cy + 16);
  ctx.quadraticCurveTo(cx - 10, cy + 16, cx - 15, cy + 7);
  ctx.closePath();
  ctx.fillStyle = '#f58ab8';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,200,222,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 8, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  toonStroke(ctx);
  for (const dx of [-6.5, 6.5]) {
    ctx.fillStyle = '#c8283c';
    ctx.beginPath();
    ctx.arc(cx + dx, cy + 0.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + dx - 1.2, cy - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#c84888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy + 8);
  ctx.quadraticCurveTo(cx, cy + 13, cx + 8, cy + 8);
  ctx.stroke();
  ctx.restore();
}

/** Ultraman silver hero. */
function drawUltraHero(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size / 64;
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.ellipse(cx, cy + 1, 16, 17, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c8d2e0';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(244,248,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(cx - 4, cy - 8, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  toonStroke(ctx);
  // color timer
  ctx.fillStyle = '#e03028';
  ctx.beginPath();
  ctx.arc(cx, cy + 6, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // eyes
  ctx.fillStyle = '#40c0ff';
  for (const dx of [-8, 8]) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy - 5, 4.5, 2.8, dx > 0 ? 0.35 : -0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Baltan-like green alien. */
function drawBaltan(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size / 64;
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 6);
  ctx.quadraticCurveTo(cx - 16, cy - 6, cx - 9, cy - 11);
  ctx.lineTo(cx - 16, cy - 20);
  ctx.lineTo(cx - 4, cy - 12);
  ctx.quadraticCurveTo(cx, cy - 13, cx + 4, cy - 12);
  ctx.lineTo(cx + 16, cy - 20);
  ctx.lineTo(cx + 9, cy - 11);
  ctx.quadraticCurveTo(cx + 16, cy - 6, cx + 14, cy + 6);
  ctx.quadraticCurveTo(cx + 10, cy + 15, cx, cy + 16);
  ctx.quadraticCurveTo(cx - 10, cy + 15, cx - 14, cy + 6);
  ctx.closePath();
  ctx.fillStyle = '#4ab878';
  ctx.fill();
  toonStroke(ctx);
  for (const dx of [-6.5, 6.5]) {
    ctx.fillStyle = '#ffd246';
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy - 1, 4.5, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Grape jelly candy. */
function drawGrapeCandy(ctx: CanvasRenderingContext2D, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 2, cx, cy, r);
  g.addColorStop(0, '#d090ff');
  g.addColorStop(0.5, '#8a40c8');
  g.addColorStop(1, '#4a1878');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,22,42,0.9)';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  // wrapper twist marks
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.3, r * 0.28, r * 0.16, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // smile
  ctx.strokeStyle = '#4a1878';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 2, r * 0.35, 0.15, Math.PI - 0.15);
  ctx.stroke();
  eyePair(ctx, cx, cy - r * 0.12, '#fff', r * 0.28);
}

/** Cream candy. */
function drawCreamCandy(ctx: CanvasRenderingContext2D, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 2, cx, cy, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#fff0c8');
  g.addColorStop(1, '#e0a040');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,22,42,0.9)';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  // stripe
  ctx.strokeStyle = 'rgba(255,140,80,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55, cy);
  ctx.quadraticCurveTo(cx, cy + r * 0.15, cx + r * 0.55, cy);
  ctx.stroke();
  eyePair(ctx, cx, cy - r * 0.15, '#fff', r * 0.28);
  ctx.strokeStyle = '#c08030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 4, r * 0.3, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

/** Blueberry. */
function drawBlueberry(ctx: CanvasRenderingContext2D, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy + 1, r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, r);
  g.addColorStop(0, '#80a0ff');
  g.addColorStop(0.5, '#4060c8');
  g.addColorStop(1, '#203888');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,22,42,0.9)';
  ctx.lineWidth = size * 0.05;
  ctx.stroke();
  // calyx
  ctx.fillStyle = '#50a040';
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 5, cy - r * 0.55 + Math.sin(a) * 3, 4, 2.5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  eyePair(ctx, cx, cy - 2, '#fff', 7);
  ctx.strokeStyle = '#203888';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + 5, 8, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

/** Strawberry. */
function drawStrawberry(ctx: CanvasRenderingContext2D, size: number): void {
  const cx = size / 2;
  const cy = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.38);
  ctx.quadraticCurveTo(cx + size * 0.42, cy + size * 0.05, cx + size * 0.28, cy - size * 0.12);
  ctx.quadraticCurveTo(cx, cy - size * 0.22, cx - size * 0.28, cy - size * 0.12);
  ctx.quadraticCurveTo(cx - size * 0.42, cy + size * 0.05, cx, cy + size * 0.38);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx, cy - size * 0.2, cx, cy + size * 0.35);
  g.addColorStop(0, '#ff9090');
  g.addColorStop(0.5, '#ff5050');
  g.addColorStop(1, '#c02828');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,22,42,0.9)';
  ctx.lineWidth = size * 0.045;
  ctx.stroke();
  // seeds
  ctx.fillStyle = '#ffe080';
  for (const [dx, dy] of [
    [-8, 0],
    [8, 2],
    [0, 10],
    [-6, 12],
    [7, 14],
  ] as const) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, 2, 1.4, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // leaf
  ctx.fillStyle = '#50c048';
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - size * 0.18);
  ctx.quadraticCurveTo(cx, cy - size * 0.38, cx + 10, cy - size * 0.18);
  ctx.quadraticCurveTo(cx, cy - size * 0.12, cx - 10, cy - size * 0.18);
  ctx.fill();
  eyePair(ctx, cx, cy - 2, '#fff', 7);
}

function drawStoneForTheme(
  ctx: CanvasRenderingContext2D,
  size: number,
  theme: ThemePalette,
  isBlack: boolean,
): void {
  switch (theme.id) {
    case ThemeId.Digimon:
      if (isBlack) drawAgumon(ctx, size);
      else drawKoromon(ctx, size);
      break;
    case ThemeId.Ultraman:
      if (isBlack) drawBaltan(ctx, size);
      else drawUltraHero(ctx, size);
      break;
    case ThemeId.Classic:
      if (isBlack) drawGrapeCandy(ctx, size);
      else drawCreamCandy(ctx, size);
      break;
    case ThemeId.NightJade:
      if (isBlack) drawBlueberry(ctx, size);
      else drawStrawberry(ctx, size);
      break;
    default:
      drawGrapeCandy(ctx, size);
  }
}

function bake(
  scene: Phaser.Scene,
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);
  draw(ctx, size);
  scene.textures.addCanvas(key, canvas);
}

export function bakeThemeTextures(scene: Phaser.Scene): void {
  const theme = getTheme();
  // High-res bakes so board/stones stay sharp when scaled up on a large playfield.
  bake(scene, TEX.board, 1024, (ctx, s) => drawPlayBoard(ctx, s, theme));
  bake(scene, TEX.black, 160, (ctx, s) => drawStoneForTheme(ctx, s, theme, true));
  bake(scene, TEX.white, 160, (ctx, s) => drawStoneForTheme(ctx, s, theme, false));
  bake(scene, TEX.blackChar, 160, (ctx, s) => drawStoneForTheme(ctx, s, theme, true));
  bake(scene, TEX.whiteChar, 160, (ctx, s) => drawStoneForTheme(ctx, s, theme, false));
}

export function stoneTextureKey(isBlack: boolean, _theme: ThemePalette): string {
  return isBlack ? TEX.blackChar : TEX.whiteChar;
}

export { css };
