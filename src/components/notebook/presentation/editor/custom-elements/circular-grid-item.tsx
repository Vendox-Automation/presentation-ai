"use client";

import { NodeApi, PathApi } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { cn } from "@/lib/utils";
import { CIRCULAR_GRID_MAX_ITEMS } from "../lib";
import {
  type TCircularGridGroupElement,
  type TCircularGridItemElement,
} from "../plugins/diagram-components-plugin";
import {
  getCircularGridItemIndex,
  getCircularGridItemPosition,
  getCircularGridItemSelfAlignment,
  getCircularGridItemTransform,
  getCircularGridPointerDirection,
  isVisibleCircularGridItem,
  useCircularGridLayoutContext,
  type CircularGridPointerDirection,
} from "./circular-grid";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";
import { getSmartLayoutStepColor } from "./smart-layout-gradient";

/** Size of the rotated square that creates the speech-bubble triangle. */
const POINTER_SIZE = 16;
const POINTER_HALF = POINTER_SIZE / 2;
/** How far inward from the corner the pointer sits. */
const POINTER_EDGE_INSET = 20;

/**
 * Returns absolute positioning CSS for the speech-bubble pointer
 * based on which direction it should point.
 */
function getPointerPositionStyle(
  direction: CircularGridPointerDirection,
): React.CSSProperties {
  switch (direction) {
    case "bottom":
      return { bottom: -POINTER_HALF, left: "50%", marginLeft: -POINTER_HALF };
    case "bottom-right":
      return { bottom: -POINTER_HALF, right: POINTER_EDGE_INSET };
    case "bottom-left":
      return { bottom: -POINTER_HALF, left: POINTER_EDGE_INSET };
    case "right":
      return { right: -POINTER_HALF, top: "50%", marginTop: -POINTER_HALF };
    case "left":
      return { left: -POINTER_HALF, top: "50%", marginTop: -POINTER_HALF };
    case "top-right":
      return { top: -POINTER_HALF, right: POINTER_EDGE_INSET };
    case "top-left":
      return { top: -POINTER_HALF, left: POINTER_EDGE_INSET };
  }
}

export function CircularGridItem(
  props: PlateElementProps<TCircularGridItemElement>,
) {
  const layoutContext = useCircularGridLayoutContext();
  const { index: fallbackIndex, parentElement } =
    getSiblingIndexContext<TCircularGridGroupElement>(
      props.editor,
      props.element,
      props.path,
    );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TCircularGridGroupElement | undefined;
  const resolvedParentElement =
    layoutContext?.parentElement ?? parentElement ?? fallbackParentElement;
  const index = getCircularGridItemIndex(
    resolvedParentElement,
    props.element,
    fallbackIndex,
  );
  const total = Math.min(
    layoutContext?.total ?? resolvedParentElement?.children?.length ?? 1,
    CIRCULAR_GRID_MAX_ITEMS,
  );
  const alignment =
    props.element.alignment ??
    layoutContext?.alignment ??
    resolvedParentElement?.alignment ??
    "center";

  const readOnly = useReadOnly();
  const position = getCircularGridItemPosition(index, total);
  const selfAlign = getCircularGridItemSelfAlignment(index, total);
  // In edit mode, BlockDraggable wrapper already applies the transform via
  // getGridStyleForElement. Only apply it ourselves in readonly/present mode.
  const transform = readOnly
    ? getCircularGridItemTransform(index, total)
    : undefined;
  const pointerDir = getCircularGridPointerDirection(index, total);
  const bgColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    getSmartLayoutStepColor(index, total),
  );
  const isVisible = isVisibleCircularGridItem(index);

  return (
    <PlateElement
      {...props}
      className={cn(
        "relative z-10 min-h-22 min-w-40 overflow-visible",
        !isVisible && "hidden",
      )}
      style={{
        gridRow: position.gridRow,
        gridColumn: position.gridColumn,
        justifySelf: selfAlign.justifySelf,
        alignSelf: selfAlign.alignSelf,
        transform,
      }}
    >
      {/* Speech-bubble pointer (sits behind content) */}
      <div
        className="absolute z-0 size-4 rotate-45"
        style={{
          background: bgColor,
          ...getPointerPositionStyle(pointerDir),
        }}
        aria-hidden="true"
        data-decor="true"
        data-bg-export="true"
      />
      {/* Content box (above pointer so the inner half is hidden) */}
      <div
        className={cn(
          "relative z-1 min-h-22 min-w-0 rounded-xl px-4 py-3 text-(--presentation-foreground)",
          alignment === "left" && "text-left",
          alignment === "center" && "text-center",
          alignment === "right" && "text-right",
          "[&_h1]:text-xl [&_h2]:text-xl [&_h3]:text-xl [&_h4]:text-lg [&_p]:mt-1 [&_p]:text-sm",
        )}
        style={
          {
            background: bgColor,
            "--presentation-heading": "var(--presentation-card-background)",
            "--presentation-text": "var(--presentation-card-background)",
          } as React.CSSProperties
        }
        data-bg-export="true"
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
