import { ThemeId, THEME_LABELS } from '../core/constants';
import { settingsRepo } from '../storage/settings';

/** Playful match-3 style — not formal go boards. */
export type BoardMaterial = 'candy' | 'garden' | 'digi' | 'ultra';
export type UiChrome = 'candy' | 'garden' | 'badge' | 'armor';

export interface ThemePalette {
  id: ThemeId;
  label: string;
  tagline: string;
  /** Side labels for the two stones. */
  blackName: string;
  whiteName: string;
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  panel: string;
  panelInner: string;
  panelBorder: string;
  panelHighlight: string;
  text: string;
  muted: string;
  accent: string;
  boardLight: string;
  boardDark: string;
  boardEdge: string;
  grid: string;
  star: string;
  blackStone: string;
  whiteStone: string;
  blackEdge: string;
  whiteEdge: string;
  lastMove: string;
  winGlow: string;
  button: string;
  buttonDark: string;
  buttonText: string;
  chipIdle: string;
  chipActive: string;
  boardMaterial: BoardMaterial;
  uiChrome: UiChrome;
  characterStones: boolean;
}

const THEMES: Record<ThemeId, ThemePalette> = {
  /** Remap Classic → 糖果派对 */
  [ThemeId.Classic]: {
    id: ThemeId.Classic,
    label: THEME_LABELS[ThemeId.Classic],
    tagline: '软糖对战 · 甜到犯规',
    blackName: '葡萄软糖',
    whiteName: '奶油糖',
    bgTop: '#5a2a5e',
    bgMid: '#2a1040',
    bgBottom: '#12081e',
    panel: '#3a1848',
    panelInner: '#2a1038',
    panelBorder: '#ff8ad4',
    panelHighlight: '#ffd0f0',
    text: '#fff0fa',
    muted: '#e0a8d0',
    accent: '#ffb0e0',
    boardLight: '#ffe8f4',
    boardDark: '#ffc8e8',
    boardEdge: '#e060b0',
    grid: '#d050a0',
    star: '#ff60c0',
    blackStone: '#8a40c8',
    whiteStone: '#fff0c8',
    blackEdge: '#4a1878',
    whiteEdge: '#e0a040',
    lastMove: '#ff5080',
    winGlow: '#ffe080',
    button: '#ff6ab8',
    buttonDark: '#c03088',
    buttonText: '#fff8fc',
    chipIdle: '#4a2058',
    chipActive: '#ff6ab8',
    boardMaterial: 'candy',
    uiChrome: 'candy',
    characterStones: true,
  },
  /** Remap NightJade → 花园鲜果 */
  [ThemeId.NightJade]: {
    id: ThemeId.NightJade,
    label: THEME_LABELS[ThemeId.NightJade],
    tagline: '阳光果园 · 香香脆脆',
    blackName: '蓝莓',
    whiteName: '草莓',
    bgTop: '#2a6a40',
    bgMid: '#143828',
    bgBottom: '#0a1810',
    panel: '#1a4830',
    panelInner: '#103424',
    panelBorder: '#7ae060',
    panelHighlight: '#c8ff90',
    text: '#f0ffe8',
    muted: '#a0d090',
    accent: '#9cf050',
    boardLight: '#e8f8c8',
    boardDark: '#c8e890',
    boardEdge: '#68a040',
    grid: '#589038',
    star: '#ff8050',
    blackStone: '#4060c8',
    whiteStone: '#ff6060',
    blackEdge: '#203888',
    whiteEdge: '#c02828',
    lastMove: '#ff9040',
    winGlow: '#ffe060',
    button: '#58c848',
    buttonDark: '#2a8830',
    buttonText: '#f4fff0',
    chipIdle: '#284838',
    chipActive: '#58c848',
    boardMaterial: 'garden',
    uiChrome: 'garden',
    characterStones: true,
  },
  [ThemeId.Digimon]: {
    id: ThemeId.Digimon,
    label: THEME_LABELS[ThemeId.Digimon],
    tagline: '数码世界 · 进化吧！',
    blackName: '亚古兽',
    whiteName: '滚球兽',
    bgTop: '#0a4860',
    bgMid: '#0a2438',
    bgBottom: '#04101c',
    panel: '#0f2b3c',
    panelInner: '#0a2030',
    panelBorder: '#2ee8a0',
    panelHighlight: '#80ffe0',
    text: '#eafff6',
    muted: '#8ac8c0',
    accent: '#ffb02e',
    boardLight: '#1e4a5e',
    boardDark: '#14384a',
    boardEdge: '#2ee8a0',
    grid: '#38b6ff',
    star: '#ffb02e',
    blackStone: '#ffa030',
    whiteStone: '#f58ab8',
    blackEdge: '#c86a08',
    whiteEdge: '#c84888',
    lastMove: '#5affc8',
    winGlow: '#ffd24a',
    button: '#ffc94a',
    buttonDark: '#d07808',
    buttonText: '#4a2604',
    chipIdle: '#1e4a5e',
    chipActive: '#ffb02e',
    boardMaterial: 'digi',
    uiChrome: 'badge',
    characterStones: true,
  },
  [ThemeId.Ultraman]: {
    id: ThemeId.Ultraman,
    label: THEME_LABELS[ThemeId.Ultraman],
    tagline: '银河之光 · 出击！',
    blackName: '巴尔坦',
    whiteName: '奥特曼',
    bgTop: '#2a1848',
    bgMid: '#10183c',
    bgBottom: '#060a1c',
    panel: '#182050',
    panelInner: '#101838',
    panelBorder: '#ff3a4e',
    panelHighlight: '#ff90a0',
    text: '#f0f4ff',
    muted: '#a0b0d8',
    accent: '#ff3a4e',
    boardLight: '#2a3a6e',
    boardDark: '#1a2848',
    boardEdge: '#8a98b8',
    grid: '#aac8ff',
    star: '#ff3a4e',
    blackStone: '#4ab878',
    whiteStone: '#c8d2e0',
    blackEdge: '#1e7a48',
    whiteEdge: '#5a6880',
    lastMove: '#40c0ff',
    winGlow: '#ffd060',
    button: '#e03028',
    buttonDark: '#a01410',
    buttonText: '#fff0f0',
    chipIdle: '#2a3a6e',
    chipActive: '#e03028',
    boardMaterial: 'ultra',
    uiChrome: 'armor',
    characterStones: true,
  },
};

let activeTheme: ThemePalette = THEMES[ThemeId.Digimon];

export function getTheme(): ThemePalette {
  return activeTheme;
}

export function getAllThemes(): ThemePalette[] {
  return Object.values(THEMES);
}

export function setTheme(id: ThemeId): ThemePalette {
  activeTheme = THEMES[id] ?? THEMES[ThemeId.Digimon];
  return activeTheme;
}

export function applyStoredTheme(): ThemePalette {
  const s = settingsRepo.load();
  return setTheme(s.themeId);
}
