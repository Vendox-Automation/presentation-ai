const MAX_PYRAMID_WIDTH_PERCENTAGE = 100;

type PyramidSegmentGeometryOptions = {
  index: number;
  totalItems: number;
  isFunnel?: boolean;
};

function getSafePyramidGeometryValues({
  index,
  totalItems,
}: PyramidSegmentGeometryOptions) {
  const safeTotalItems = Math.max(totalItems, 1);
  const safeIndex = Math.min(Math.max(index, 0), safeTotalItems - 1);
  const increment = MAX_PYRAMID_WIDTH_PERCENTAGE / (2 * safeTotalItems);

  return {
    increment,
    safeIndex,
    safeTotalItems,
  };
}

export function getPyramidSegmentClipPath(
  options: PyramidSegmentGeometryOptions,
) {
  const { increment, safeIndex, safeTotalItems } =
    getSafePyramidGeometryValues(options);

  if (options.isFunnel) {
    const topOffset = increment * (safeTotalItems - safeIndex);
    const topLeft = 50 - topOffset;
    const topRight = 50 + topOffset;

    if (safeIndex === safeTotalItems - 1) {
      return `polygon(${topLeft}% 0%, ${topRight}% 0%, 50% 100%)`;
    }

    const bottomOffset = increment * (safeTotalItems - safeIndex - 1);
    const bottomLeft = 50 - bottomOffset;
    const bottomRight = 50 + bottomOffset;

    return `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;
  }

  if (safeIndex === 0) {
    return `polygon(50% 0%, ${50 - increment}% 100%, ${50 + increment}% 100%)`;
  }

  const topOffset = increment * safeIndex;
  const bottomOffset = increment * (safeIndex + 1);
  const topLeft = 50 - topOffset;
  const topRight = 50 + topOffset;
  const bottomLeft = 50 - bottomOffset;
  const bottomRight = 50 + bottomOffset;

  return `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;
}

export function getPyramidTextOffset(options: PyramidSegmentGeometryOptions) {
  const { increment, safeIndex, safeTotalItems } =
    getSafePyramidGeometryValues(options);
  const halfMaxWidth = MAX_PYRAMID_WIDTH_PERCENTAGE / 2;

  if (options.isFunnel) {
    // Widest is at the top of the segment
    return halfMaxWidth - (safeTotalItems - safeIndex) * increment;
  }

  // Widest is at the bottom of the segment
  return halfMaxWidth - (safeIndex + 1) * increment;
}

export function getPyramidBorderExtension(
  options: PyramidSegmentGeometryOptions,
) {
  const { increment } = getSafePyramidGeometryValues(options);
  // For Funnel, the border (at bottom) is at the narrowest point, so it needs extension to reach the slanted side
  // For Pyramid, the border (at bottom) is at the widest point, so it already touches
  if (options.isFunnel) {
    return increment;
  }
  return 0;
}
