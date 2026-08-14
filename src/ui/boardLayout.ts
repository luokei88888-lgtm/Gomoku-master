import { BOARD_SIZE } from '../core/constants';

/** Top status / player strip height. */
export const PLAY_HEADER_H = 112;
/** Bottom action bar height. */
export const PLAY_FOOTER_H = 120;

export interface BoardLayout {
  cell: number;
  boardVisual: number;
  originX: number;
  originY: number;
  stoneSize: number;
  headerY: number;
  footerY: number;
}

/**
 * Vertical stack: header → full-width board → footer.
 * Board uses the full content width so cells/stones stay large (mobile-style).
 */
export function computeBoardLayout(viewW: number, viewH: number): BoardLayout {
  const sidePad = 20;
  const headerH = PLAY_HEADER_H;
  const footerH = PLAY_FOOTER_H;
  const gapTop = 8;
  const gapBottom = 10;

  const maxByW = viewW - sidePad * 2;
  const maxByH = viewH - headerH - footerH - gapTop - gapBottom;
  const maxBoard = Math.min(maxByW, maxByH);

  const cell = Math.max(1, Math.floor(maxBoard / (BOARD_SIZE + 1)));
  const boardVisual = cell * (BOARD_SIZE + 1);
  const originX = Math.floor((viewW - boardVisual) / 2);
  const originY = headerH + gapTop + Math.floor(Math.max(0, maxByH - boardVisual) / 2);
  const stoneSize = Math.max(1, Math.min(cell, Math.round(cell * 0.96)));

  return {
    cell,
    boardVisual,
    originX,
    originY,
    stoneSize,
    headerY: headerH / 2,
    footerY: viewH - footerH / 2,
  };
}

