/**
 * Shared constants and SVG helpers for the snake diagram component.
 *
 * Layout: CSS Grid with N columns x SNAKE_GRID_ROWS rows.
 * Each column holds one item. Even-indexed items leave row 1 open for the
 * upper arrow, odd-indexed items leave row 5 open for the lower arrow.
 */

/** Number of rows in the snake grid */
export const SNAKE_GRID_ROWS = 5;

/** Logical height of one cell in the SVG coordinate system */
const SNAKE_CELL_HEIGHT = 60;

/** Total SVG height = SNAKE_GRID_ROWS * SNAKE_CELL_HEIGHT */
export const SNAKE_SVG_HEIGHT = SNAKE_GRID_ROWS * SNAKE_CELL_HEIGHT;

/** Width allocated per column in SVG units */
export const SNAKE_COL_WIDTH = 220;

/** Fixed layout height in real pixels */
export const SNAKE_LAYOUT_HEIGHT_PX = 280;

export const SNAKE_EDGE_PADDING_X = 48;
const SNAKE_BASELINE_Y = SNAKE_SVG_HEIGHT / 2;
export const SNAKE_START_DOT_RADIUS = 8;
export const SNAKE_START_DOT_GAP = 18;
export const SNAKE_END_ARROW_LENGTH = 38;
const SNAKE_SEMICIRCLE_START_CUT = 0;
const SNAKE_ROW_GAP_Y = 24;

/**
 * Returns the first drawable X position for a column semicircle.
 */
export function getSnakeArrowStartX(index: number): number {
  return index * SNAKE_COL_WIDTH + SNAKE_SEMICIRCLE_START_CUT;
}

/**
 * Returns the last drawable X position for a column semicircle.
 */
export function getSnakeArrowEndX(index: number): number {
  return (index + 1) * SNAKE_COL_WIDTH;
}

/**
 * Returns the centerline Y position for each alternating semicircle lane.
 */
export function getSnakeArrowBaselineY(index: number): number {
  return index % 2 === 0
    ? SNAKE_BASELINE_Y
    : SNAKE_BASELINE_Y + SNAKE_ROW_GAP_Y;
}

/**
 * Total SVG width based on total number of items.
 */
export function getSvgWidth(total: number): number {
  return Math.max(total, 1) * SNAKE_COL_WIDTH;
}

/**
 * Builds the alternating top/bottom semicircle path for a snake item.
 */
export function buildSnakeArrowPath(index: number): string {
  const startX = getSnakeArrowStartX(index);
  const endX = getSnakeArrowEndX(index);
  const baselineY = getSnakeArrowBaselineY(index);
  const radius = (endX - startX) / 2;
  const sweepFlag = index % 2 === 0 ? 1 : 0;

  return [
    `M ${startX.toFixed(1)} ${baselineY.toFixed(1)}`,
    `A ${radius.toFixed(1)} ${radius.toFixed(1)}`,
    `0 0 ${sweepFlag}`,
    `${endX.toFixed(1)} ${baselineY.toFixed(1)}`,
  ].join(" ");
}

/**
 * Returns CSS gridRow value for a snake item.
 * Even items leave row 1 for the upper arrow; odd items leave row 5.
 */
export function getSnakeGridRow(index: number): string {
  return index % 2 === 0 ? "2 / 6" : "1 / 5";
}

/**
 * Returns CSS gridColumn value for a snake item.
 */
export function getSnakeGridColumn(index: number): string {
  return `${index + 1}`;
}
