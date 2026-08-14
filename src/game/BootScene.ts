import Phaser from 'phaser';
import { bakeThemeTextures } from '../art/textures';
import { applyStoredTheme } from '../art/themes';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    applyStoredTheme();
    bakeThemeTextures(this);
    this.scene.start('Menu');
  }
}
