export const CONNECTED_CIRCLE_SIZE_PX = 224;
export const CONNECTED_CIRCLE_GAP_PX = 4;
const PROMOTED_CENTER_OFFSET_PX = 12;

export function getConnectedCircleItemPosition(
  index: number,
  total: number,
): { gridRow: string; gridColumn: string } {
  const safeIndex = Math.max(0, index);
  const safeTotal = Math.max(1, total);

  if (safeTotal <= 2) {
    return {
      gridRow: `${safeIndex + 1}`,
      gridColumn: "1 / 3",
    };
  }

  if (safeTotal % 2 === 1 && safeIndex === safeTotal - 1) {
    return {
      gridRow: "1",
      gridColumn: "1 / 3",
    };
  }

  const rowOffset = safeTotal % 2 === 1 ? 2 : 1;

  return {
    gridRow: `${Math.floor(safeIndex / 2) + rowOffset}`,
    gridColumn: `${(safeIndex % 2) + 1}`,
  };
}

export function getConnectedCircleItemTransform(
  index: number,
  total: number,
): string | undefined {
  const safeIndex = Math.max(0, index);
  const safeTotal = Math.max(1, total);
  const isPromotedCenterItem =
    safeTotal > 2 && safeTotal % 2 === 1 && safeIndex === safeTotal - 1;

  return isPromotedCenterItem
    ? `translateY(${PROMOTED_CENTER_OFFSET_PX}px)`
    : undefined;
}
