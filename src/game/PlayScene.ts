import Phaser from 'phaser';
import {
  BOARD_SIZE,
  DIFFICULTY_LABELS,
  GameResult,
  Stone,
  ThemeId,
} from '../core/constants';
import type { CellPos, PlaySessionConfig } from '../core/types';
import { GomokuGame } from '../core/game';
import { opponent } from '../core/board';
import { chooseMove, hintMove } from '../ai/search';
import { bakeThemeTextures, stoneTextureKey, TEX } from '../art/textures';
import { getTheme, setTheme } from '../art/themes';
import { getSfx } from '../audio/sfx';
import { getLevel, levelDifficultyLabel } from '../data/levels';
import { progressRepo, recordLevelWin, starsForClear } from '../storage/progress';
import { recordsRepo } from '../storage/records';
import { settingsRepo } from '../storage/settings';
import { fillBackground, hex, makeButton, titleText } from '../ui/widgets';
import { computeBoardLayout, PLAY_FOOTER_H, PLAY_HEADER_H } from '../ui/boardLayout';

interface PlayData extends PlaySessionConfig {}

export class PlayScene extends Phaser.Scene {
  private gameState!: GomokuGame;
  private config!: PlayData;
  private cell = 40;
  private stoneSize = 36;
  private originX = 0;
  private originY = 0;
  private boardRoot!: Phaser.GameObjects.Container;
  private stoneSprites = new Map<string, Phaser.GameObjects.Image>();
  private marker?: Phaser.GameObjects.Arc;
  private hintMarker?: Phaser.GameObjects.Arc;
  private statusText!: Phaser.GameObjects.Text;
  private turnStone!: Phaser.GameObjects.Image;
  private playerAlpha!: Phaser.GameObjects.Image;
  private aiAlpha!: Phaser.GameObjects.Image;
  private turnArrow!: Phaser.GameObjects.Text;
  private thinking = false;
  private saved = false;
  private earnedStars = 0;
  private newTitleLevelId: number | null = null;
  private progressSaveFailed = false;
  private lastRecordId: string | undefined;

  constructor() {
    super('Play');
  }

  init(data: PlayData): void {
    this.config = {
      mode: data.mode ?? 'free',
      difficulty: data.difficulty,
      playerStone: data.playerStone,
      themeId: data.themeId,
      levelId: data.levelId,
      aiDepth: data.aiDepth,
      aiBlunderRate: data.aiBlunderRate,
      aiRadius: data.aiRadius,
    };
    this.gameState = new GomokuGame();
    this.thinking = false;
    this.saved = false;
    this.earnedStars = 0;
    this.newTitleLevelId = null;
    this.progressSaveFailed = false;
    this.stoneSprites.clear();
  }

  create(): void {
    if (
      this.config.mode === 'campaign' &&
      this.config.levelId &&
      this.config.levelId > progressRepo.load().maxUnlocked
    ) {
      this.scene.start('Map');
      return;
    }

    setTheme(this.config.themeId);
    bakeThemeTextures(this);
    const theme = getTheme();
    const settings = settingsRepo.load();
    const sfx = getSfx(settings.volume);
    fillBackground(this);

    const W = this.scale.width;
    const H = this.scale.height;
    const layout = computeBoardLayout(W, H);
    this.cell = layout.cell;
    this.stoneSize = layout.stoneSize;
    const boardVisual = layout.boardVisual;
    this.originX = layout.originX;
    this.originY = layout.originY;

    this.drawHeader(W, theme);
    this.drawBoard(boardVisual);
    this.drawFooter(W, H, layout.footerY, sfx, settings.volume);

    this.updateStatus();
    this.maybeAiMove();
  }

  private drawHeader(W: number, theme: ReturnType<typeof getTheme>): void {
    const g = this.add.graphics();
    g.fillStyle(hex(theme.panel), 0.92);
    g.fillRoundedRect(14, 10, W - 28, PLAY_HEADER_H - 16, 20);
    g.lineStyle(2, hex(theme.panelBorder), 0.7);
    g.strokeRoundedRect(14, 10, W - 28, PLAY_HEADER_H - 16, 20);

    const level = this.config.levelId ? getLevel(this.config.levelId) : null;
    const aiLabel =
      this.config.mode === 'campaign' && level
        ? `${levelDifficultyLabel(level)}`
        : DIFFICULTY_LABELS[this.config.difficulty];
    const aiSub =
      this.config.mode === 'campaign' && this.config.levelId
        ? `第 ${this.config.levelId} 关`
        : '电脑';

    const leftX = 78;
    const rightX = W - 78;
    const midY = PLAY_HEADER_H / 2 - 2;

    // Player (you)
    this.playerAlpha = this.add
      .image(leftX, midY - 8, stoneTextureKey(this.config.playerStone === Stone.Black, theme))
      .setDisplaySize(54, 54);
    this.add
      .text(leftX, midY + 34, '你', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        color: theme.buttonText,
      })
      .setOrigin(0.5);
    this.add
      .text(leftX + 70, midY - 6, this.config.playerStone === Stone.Black ? theme.blackName : theme.whiteName, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        color: theme.text,
      })
      .setOrigin(0, 0.5);

    // AI
    const aiStone = opponent(this.config.playerStone) as Stone.Black | Stone.White;
    this.aiAlpha = this.add
      .image(rightX, midY - 8, stoneTextureKey(aiStone === Stone.Black, theme))
      .setDisplaySize(54, 54);
    this.add
      .text(rightX, midY + 34, '电脑', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        color: theme.buttonText,
      })
      .setOrigin(0.5);
    this.add
      .text(rightX - 70, midY - 10, aiLabel, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        color: theme.text,
      })
      .setOrigin(1, 0.5);
    this.add
      .text(rightX - 70, midY + 12, aiSub, {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '13px',
        fontStyle: '700',
        color: theme.muted,
      })
      .setOrigin(1, 0.5);

    // Center turn indicator
    this.turnStone = this.add
      .image(W / 2, midY - 14, stoneTextureKey(true, theme))
      .setDisplaySize(44, 44);
    this.turnArrow = this.add
      .text(W / 2, midY + 18, '▼', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '14px',
        color: theme.accent,
      })
      .setOrigin(0.5);
    this.statusText = this.add
      .text(W / 2, midY + 38, '', {
        fontFamily: '"Nunito", "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        fontStyle: '700',
        color: theme.accent,
      })
      .setOrigin(0.5);
  }

  private drawBoard(boardVisual: number): void {
    this.boardRoot = this.add.container(this.originX, this.originY);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(12, 16, boardVisual, boardVisual, 10);
    this.boardRoot.add(shadow);
    this.boardRoot.add(
      this.add.image(boardVisual / 2, boardVisual / 2, TEX.board).setDisplaySize(boardVisual, boardVisual),
    );
    this.drawGrid(boardVisual);

    const hit = this.add
      .rectangle(boardVisual / 2, boardVisual / 2, boardVisual, boardVisual, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    this.boardRoot.add(hit);
    hit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.thinking || this.gameState.isOver()) return;
      if (this.gameState.getCurrent() !== this.config.playerStone) return;
      const localX = pointer.x - this.originX;
      const localY = pointer.y - this.originY;
      const col = Math.round(localX / this.cell) - 1;
      const row = Math.round(localY / this.cell) - 1;
      this.tryPlayerMove(row, col);
    });
  }

  private drawFooter(
    W: number,
    H: number,
    footerY: number,
    sfx: { click: () => void; undo: () => void; hint: () => void; lose: () => void; setVolume: (v: number) => void },
    volume: number,
  ): void {
    const theme = getTheme();
    const g = this.add.graphics();
    g.fillStyle(hex(theme.panel), 0.92);
    g.fillRoundedRect(14, H - PLAY_FOOTER_H + 6, W - 28, PLAY_FOOTER_H - 18, 22);
    g.lineStyle(2, hex(theme.panelBorder), 0.7);
    g.strokeRoundedRect(14, H - PLAY_FOOTER_H + 6, W - 28, PLAY_FOOTER_H - 18, 22);

    const labels = ['退出', '悔棋', '提示', '重开', '设置'] as const;
    const count = labels.length;
    const btnW = Math.min(118, (W - 48) / count - 10);
    const span = count * (btnW + 10) - 10;
    const startX = (W - span) / 2 + btnW / 2;

    const actions: Array<() => void> = [
      () => {
        if (this.gameState.isOver() || this.saved) return;
        sfx.click();
        this.scene.start(this.config.mode === 'campaign' ? 'Map' : 'Menu');
      },
      () => {
        if (this.thinking || this.gameState.isOver()) return;
        const u = this.gameState.undo(true);
        if (!u.ok) return;
        sfx.undo();
        this.clearHint();
        this.rebuildStones();
        this.updateStatus();
        this.maybeAiMove();
      },
      () => {
        if (this.thinking || this.gameState.isOver()) return;
        if (this.gameState.getCurrent() !== this.config.playerStone) return;
        const m = hintMove(
          this.gameState.getBoard(),
          this.config.playerStone,
          this.config.difficulty,
          { depth: this.config.aiDepth, blunderRate: this.config.aiBlunderRate, radius: this.config.aiRadius },
        );
        if (!m) return;
        sfx.hint();
        this.showHint(m);
      },
      () => {
        if (this.gameState.isOver() || this.saved) return;
        sfx.click();
        this.scene.restart(this.config);
      },
      () => {
        if (this.gameState.isOver() || this.saved) return;
        sfx.click();
        this.openPlaySettings(sfx, volume);
      },
    ];

    labels.forEach((label, i) => {
      makeButton(this, {
        x: startX + i * (btnW + 10),
        y: footerY,
        w: btnW,
        h: 52,
        label,
        fontSize: 17,
        onClick: actions[i]!,
      });
    });
  }

  private openPlaySettings(
    sfx: { click: () => void; lose: () => void; setVolume: (v: number) => void },
    volume: number,
  ): void {
    const theme = getTheme();
    const W = this.scale.width;
    const H = this.scale.height;
    const root = this.add.container(0, 0).setDepth(200);

    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    root.add(dim);

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.3);
    panel.fillRoundedRect(W / 2 - 190 + 4, H / 2 - 180 + 6, 380, 360, 22);
    panel.fillStyle(hex(theme.panel), 1);
    panel.fillRoundedRect(W / 2 - 190, H / 2 - 180, 380, 360, 22);
    panel.lineStyle(3, hex(theme.panelBorder), 0.95);
    panel.strokeRoundedRect(W / 2 - 190, H / 2 - 180, 380, 360, 22);
    root.add(panel);

    const title = titleText(this, W / 2, H / 2 - 140, '对局设置', 32);
    root.add(title);

    let vol = volume;
    const extras: Phaser.GameObjects.GameObject[] = [];
    const close = () => {
      for (const o of extras) o.destroy();
      root.destroy(true);
    };

    dim.on('pointerdown', close);

    const addBtn = (y: number, label: string, onClick: () => void, w = 260, h = 46, fontSize = 18) => {
      const btn = makeButton(this, { x: W / 2, y, w, h, label, fontSize, onClick });
      btn.setDepth(201);
      extras.push(btn);
      return btn;
    };

    addBtn(H / 2 - 70, vol <= 0.01 ? '音效：关' : '音效：开', () => {
      if (this.gameState.isOver() || this.saved) return;
      const s = settingsRepo.load();
      s.volume = s.volume <= 0.01 ? 0.7 : 0;
      settingsRepo.save(s);
      vol = s.volume;
      sfx.setVolume(vol);
      if (vol > 0) sfx.click();
      close();
      this.scene.restart(this.config);
    });

    addBtn(H / 2 - 10, '切换主题', () => {
      if (this.gameState.isOver() || this.saved) return;
      sfx.click();
      const order = [ThemeId.Digimon, ThemeId.Ultraman, ThemeId.Classic, ThemeId.NightJade];
      const idx = order.indexOf(this.config.themeId);
      const next = order[(idx + 1) % order.length]!;
      this.config.themeId = next;
      const s = settingsRepo.load();
      s.themeId = next;
      settingsRepo.save(s);
      setTheme(next);
      bakeThemeTextures(this);
      close();
      this.scene.restart(this.config);
    });

    addBtn(H / 2 + 50, '认输', () => {
      if (this.thinking || this.gameState.isOver()) return;
      close();
      sfx.lose();
      this.finishByResign();
    });

    addBtn(H / 2 + 120, '关闭', () => {
      sfx.click();
      close();
    }, 200, 44, 17);
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
    const stars = [3, 7, 11];
    g.fillStyle(hex(theme.star), 0.9);
    const starR = Math.max(3.5, this.cell * 0.09);
    for (const r of stars) {
      for (const c of stars) {
        g.fillCircle(this.cell * (c + 1), this.cell * (r + 1), starR);
      }
    }
    this.boardRoot.add(g);
  }

  private cellToXY(row: number, col: number): { x: number; y: number } {
    return { x: this.cell * (col + 1), y: this.cell * (row + 1) };
  }

  private tryPlayerMove(row: number, col: number): void {
    const sfx = getSfx(settingsRepo.load().volume);
    this.clearHint();
    const res = this.gameState.place(row, col);
    if (!res.ok) return;
    sfx.place();
    this.addStoneSprite(row, col, this.config.playerStone);
    this.markLast(row, col);
    this.updateStatus();
    if (res.result !== GameResult.None) {
      this.onGameEnd(res.result);
      return;
    }
    this.maybeAiMove();
  }

  private maybeAiMove(): void {
    if (this.gameState.isOver()) return;
    const aiStone = opponent(this.config.playerStone) as Stone.Black | Stone.White;
    if (this.gameState.getCurrent() !== aiStone) {
      this.updateStatus();
      return;
    }
    this.thinking = true;
    this.updateStatus();
    this.time.delayedCall(40, () => {
      const board = this.gameState.getBoard();
      const move = chooseMove(board, {
        difficulty: this.config.difficulty,
        stone: aiStone,
        depth: this.config.aiDepth,
        blunderRate: this.config.aiBlunderRate,
        radius: this.config.aiRadius,
      });
      this.thinking = false;
      if (!move || this.gameState.isOver()) {
        this.updateStatus();
        return;
      }
      const sfx = getSfx(settingsRepo.load().volume);
      const res = this.gameState.place(move.row, move.col);
      if (!res.ok) {
        this.updateStatus();
        return;
      }
      sfx.place();
      this.addStoneSprite(move.row, move.col, aiStone);
      this.markLast(move.row, move.col);
      this.updateStatus();
      if (res.result !== GameResult.None) this.onGameEnd(res.result);
    });
  }

  private addStoneSprite(row: number, col: number, stone: Stone): void {
    const theme = getTheme();
    const { x, y } = this.cellToXY(row, col);
    const key = stoneTextureKey(stone === Stone.Black, theme);
    const img = this.add.image(x, y, key).setDisplaySize(this.stoneSize, this.stoneSize);
    this.boardRoot.add(img);
    this.stoneSprites.set(`${row},${col}`, img);
  }

  private rebuildStones(): void {
    for (const s of this.stoneSprites.values()) s.destroy();
    this.stoneSprites.clear();
    this.marker?.destroy();
    this.marker = undefined;
    for (const m of this.gameState.getMoves()) {
      this.addStoneSprite(m.row, m.col, m.stone);
    }
    const moves = this.gameState.getMoves();
    if (moves.length > 0) {
      const last = moves[moves.length - 1]!;
      this.markLast(last.row, last.col);
    }
    const line = this.gameState.getWinningLine();
    if (line) this.highlightWin(line);
  }

  private markLast(row: number, col: number): void {
    this.marker?.destroy();
    const theme = getTheme();
    const { x, y } = this.cellToXY(row, col);
    this.marker = this.add.circle(x, y, Math.max(3, this.cell * 0.1), hex(theme.lastMove));
    this.boardRoot.add(this.marker);
  }

  private showHint(pos: CellPos): void {
    this.clearHint();
    const theme = getTheme();
    const { x, y } = this.cellToXY(pos.row, pos.col);
    this.hintMarker = this.add
      .circle(x, y, this.cell * 0.28, hex(theme.accent), 0.35)
      .setStrokeStyle(2, hex(theme.accent));
    this.boardRoot.add(this.hintMarker);
  }

  private clearHint(): void {
    this.hintMarker?.destroy();
    this.hintMarker = undefined;
  }

  private highlightWin(line: CellPos[]): void {
    const theme = getTheme();
    for (const p of line) {
      const { x, y } = this.cellToXY(p.row, p.col);
      const ring = this.add.circle(x, y, this.cell * 0.42).setStrokeStyle(3, hex(theme.winGlow));
      this.boardRoot.add(ring);
    }
  }

  private updateStatus(): void {
    const theme = getTheme();
    const cur = this.gameState.getCurrent();
    const playerTurn = cur === this.config.playerStone && !this.thinking && !this.gameState.isOver();
    const aiTurn = !playerTurn && !this.gameState.isOver();

    this.playerAlpha?.setAlpha(playerTurn || this.gameState.isOver() ? 1 : 0.45);
    this.aiAlpha?.setAlpha(aiTurn || this.gameState.isOver() ? 1 : 0.45);

    const showBlack = cur === Stone.Black;
    this.turnStone?.setTexture(stoneTextureKey(showBlack, theme));
    this.turnArrow?.setText(playerTurn ? '◀' : aiTurn ? '▶' : '●');

    if (this.gameState.isOver()) {
      this.statusText.setText(this.resultLabel(this.gameState.getResult()));
      return;
    }
    if (this.thinking) {
      this.statusText.setText('电脑思考中…');
      return;
    }
    this.statusText.setText(playerTurn ? '轮到你落子' : '等待电脑');
  }

  private resultLabel(r: GameResult): string {
    if (r === GameResult.Draw) return '和棋';
    const playerWon =
      (r === GameResult.BlackWin && this.config.playerStone === Stone.Black) ||
      (r === GameResult.WhiteWin && this.config.playerStone === Stone.White);
    return playerWon ? '你赢了！' : '电脑获胜';
  }

  private resultPayload(result: GameResult) {
    return {
      result,
      playerStone: this.config.playerStone,
      difficulty: this.config.difficulty,
      themeId: this.config.themeId,
      moves: this.gameState.getMoves().map((m) => ({ row: m.row, col: m.col })),
      recordId: this.lastRecordId,
      mode: this.config.mode,
      levelId: this.config.levelId,
      stars: this.earnedStars,
      newTitleLevelId: this.newTitleLevelId ?? undefined,
      progressSaveFailed: this.progressSaveFailed || undefined,
      aiDepth: this.config.aiDepth,
      aiBlunderRate: this.config.aiBlunderRate,
      aiRadius: this.config.aiRadius,
    };
  }

  private finishByResign(): void {
    const result =
      this.config.playerStone === Stone.Black ? GameResult.WhiteWin : GameResult.BlackWin;
    this.persist(result);
    this.scene.start('Result', this.resultPayload(result));
  }

  private persist(result: GameResult): void {
    if (this.saved) return;
    this.saved = true;
    const id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.lastRecordId = id;
    recordsRepo.add({
      id,
      difficulty: this.config.difficulty,
      playerStone: this.config.playerStone,
      result,
      moves: this.gameState.getMoves().map((m) => ({ row: m.row, col: m.col })),
      themeId: this.config.themeId,
    });

    const playerWon =
      (result === GameResult.BlackWin && this.config.playerStone === Stone.Black) ||
      (result === GameResult.WhiteWin && this.config.playerStone === Stone.White);
    if (this.config.mode === 'campaign' && this.config.levelId && playerWon) {
      const moves = this.gameState.getMoves().length;
      this.earnedStars = starsForClear(moves);
      const progress = progressRepo.load();
      const { progress: next, newTitleLevelId } = recordLevelWin(
        progress,
        this.config.levelId,
        moves,
      );
      this.newTitleLevelId = newTitleLevelId;
      const saved = progressRepo.save(next);
      this.progressSaveFailed = !saved.ok;
    }
  }

  private onGameEnd(result: GameResult): void {
    const line = this.gameState.getWinningLine();
    if (line) this.highlightWin(line);
    const sfx = getSfx(settingsRepo.load().volume);
    const playerWon =
      (result === GameResult.BlackWin && this.config.playerStone === Stone.Black) ||
      (result === GameResult.WhiteWin && this.config.playerStone === Stone.White);
    if (result === GameResult.Draw) sfx.draw();
    else if (playerWon) sfx.win();
    else sfx.lose();
    this.persist(result);
    this.time.delayedCall(700, () => {
      this.scene.start('Result', this.resultPayload(result));
    });
  }
}
