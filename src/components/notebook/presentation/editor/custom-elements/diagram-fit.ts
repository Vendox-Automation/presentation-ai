"use client";

import React from "react";

const DIAGRAM_SCALE_EPSILON = 0.001;
const DIAGRAM_SIZE_EPSILON_PX = 0.5;

type DiagramAlignment = "left" | "center" | "right";

export function getDiagramFitFrameStyle(
  alignment: DiagramAlignment = "center",
) {
  return {
    left: alignment === "right" ? "auto" : 0,
    marginLeft: alignment === "center" ? "auto" : undefined,
    marginRight: alignment === "center" ? "auto" : undefined,
    right: alignment === "right" ? 0 : "auto",
  } satisfies React.CSSProperties;
}

export function useDiagramFitScale<TContainer extends HTMLElement>(
  layoutWidth: number,
  minLayoutHeight: number,
) {
  const containerRef = React.useRef<TContainer | null>(null);
  const layoutRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [layoutHeight, setLayoutHeight] = React.useState(minLayoutHeight);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const updateScale = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const availableWidth = container.clientWidth;
        const nextScale =
          availableWidth > 0 ? Math.min(1, availableWidth / layoutWidth) : 1;

        setScale((currentScale) =>
          Math.abs(currentScale - nextScale) > DIAGRAM_SCALE_EPSILON
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
  }, [layoutWidth]);

  React.useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (!layout) return;

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextHeight = Math.max(layout.scrollHeight, minLayoutHeight);

        setLayoutHeight((currentHeight) =>
          Math.abs(currentHeight - nextHeight) > DIAGRAM_SIZE_EPSILON_PX
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
