import React from "react";

const ALTERNATING_BOX_COLUMN_WIDTH_PX = 220;
export const ALTERNATING_BOX_COLUMN_GAP_PX = 0;
export const ALTERNATING_BOX_ROW_GAP_PX = 0;
export const ALTERNATING_BOX_MIN_ROW_HEIGHT_PX = 112;
const ALTERNATING_BOX_MIN_LAYOUT_WIDTH_PX = 720;

const ALTERNATING_BOX_SCALE_EPSILON = 0.001;
const ALTERNATING_BOX_SIZE_EPSILON_PX = 0.5;

export type AlternatingBoxOrientation = "horizontal" | "vertical";

function getAlternatingBoxLayoutWidth(
  itemCount: number,
  orientation: AlternatingBoxOrientation,
  availableWidth = 0,
) {
  const columnCount = Math.max(itemCount, 1);
  const minimumWidth =
    orientation === "vertical"
      ? ALTERNATING_BOX_MIN_LAYOUT_WIDTH_PX
      : columnCount * ALTERNATING_BOX_COLUMN_WIDTH_PX +
        (columnCount - 1) * ALTERNATING_BOX_COLUMN_GAP_PX;

  return Math.max(availableWidth, minimumWidth);
}

function getAlternatingBoxMinLayoutHeight(
  itemCount: number,
  orientation: AlternatingBoxOrientation,
) {
  const rowCount = Math.max(itemCount, 1);

  if (orientation === "vertical") {
    return (
      rowCount * ALTERNATING_BOX_MIN_ROW_HEIGHT_PX +
      (rowCount - 1) * ALTERNATING_BOX_ROW_GAP_PX
    );
  }

  return ALTERNATING_BOX_MIN_ROW_HEIGHT_PX * 2 + ALTERNATING_BOX_ROW_GAP_PX;
}

export function getAlternatingBoxPlacementCss(
  layoutId: string,
  itemCount: number,
  orientation: AlternatingBoxOrientation,
) {
  return Array.from({ length: itemCount }, (_, index) => {
    const childIndex = index + 1;
    const column =
      orientation === "vertical" ? (index % 2 === 0 ? 1 : 2) : childIndex;
    const row =
      orientation === "vertical" ? childIndex : index % 2 === 0 ? 1 : 2;

    return `
      [data-alternating-box-layout="${layoutId}"] > [data-dnd-wrapper]:nth-child(${childIndex}),
      [data-alternating-box-layout="${layoutId}"] > :not([data-dnd-wrapper]):nth-child(${childIndex}) {
        grid-column-start: ${column};
        grid-row-start: ${row};
        min-width: 0;
        position: relative;
        width: 100%;
        z-index: 1;
      }
    `;
  }).join("\n");
}

export function useAlternatingBoxFitScale<TContainer extends HTMLElement>(
  itemCount: number,
  orientation: AlternatingBoxOrientation,
) {
  const containerRef = React.useRef<TContainer | null>(null);
  const layoutRef = React.useRef<HTMLDivElement | null>(null);
  const minLayoutHeight = getAlternatingBoxMinLayoutHeight(
    itemCount,
    orientation,
  );
  const [scale, setScale] = React.useState(1);
  const [layoutWidth, setLayoutWidth] = React.useState(
    getAlternatingBoxLayoutWidth(itemCount, orientation),
  );
  const [layoutHeight, setLayoutHeight] = React.useState(minLayoutHeight);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const updateScale = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const availableWidth = container.clientWidth;
        const nextLayoutWidth = getAlternatingBoxLayoutWidth(
          itemCount,
          orientation,
          availableWidth,
        );
        const nextScale =
          availableWidth > 0
            ? Math.min(1, availableWidth / nextLayoutWidth)
            : 1;

        setLayoutWidth((currentWidth) =>
          Math.abs(currentWidth - nextLayoutWidth) >
          ALTERNATING_BOX_SIZE_EPSILON_PX
            ? nextLayoutWidth
            : currentWidth,
        );
        setScale((currentScale) =>
          Math.abs(currentScale - nextScale) > ALTERNATING_BOX_SCALE_EPSILON
            ? nextScale
            : currentScale,
        );
      });
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [itemCount, orientation]);

  React.useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextHeight = Math.max(layout.scrollHeight, minLayoutHeight);

        setLayoutHeight((currentHeight) =>
          Math.abs(currentHeight - nextHeight) > ALTERNATING_BOX_SIZE_EPSILON_PX
            ? nextHeight
            : currentHeight,
        );
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(layout);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [minLayoutHeight]);

  return {
    containerRef,
    layoutRef,
    frameStyle: {
      height: layoutHeight * scale,
      maxWidth: "100%",
      overflow: "visible",
      position: "relative",
      width: layoutWidth * scale,
    } satisfies React.CSSProperties,
    fitStyle: {
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      width: layoutWidth,
    } satisfies React.CSSProperties,
  };
}
