import Phaser from 'phaser';
import { applyStoredTheme } from './art/themes';
import { BootScene } from './game/BootScene';
import { MenuScene } from './game/MenuScene';
import { MapScene } from './game/MapScene';
import { PlayScene } from './game/PlayScene';
import { ResultScene } from './game/ResultScene';
import { ReplayScene } from './game/ReplayScene';
import { HistoryScene } from './game/HistoryScene';

applyStoredTheme();

const parent = document.getElementById('game-container');

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: parent ?? undefined,
  backgroundColor: '#0a2438',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 900,
    height: 1400,
  },
  scene: [BootScene, MenuScene, MapScene, PlayScene, ResultScene, ReplayScene, HistoryScene],
  audio: {
    disableWebAudio: false,
  },
  input: {
    activePointers: 2,
  },
  render: {
    antialias: true,
    // Avoid forced pixel rounding which softens scaled character stones.
    roundPixels: false,
  },
};

const game = new Phaser.Game(config);
(window as unknown as { __gomoku?: Phaser.Game }).__gomoku = game;
