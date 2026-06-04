"use client";

import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { CIRCULAR_GRID_MAX_ITEMS } from "../../lib";
import { type TCircularGridGroupElement } from "../../plugins/diagram-components-plugin";
import {
  getCircularGridItemIndex,
  getCircularGridItemPosition,
  getCircularGridItemSelfAlignment,
  getCircularGridItemTransform,
  getCircularGridPointerDirection,
  isVisibleCircularGridItem,
  useCircularGridLayoutContext,
  type CircularGridPointerDirection,
} from "../circular-grid";
import { getSmartLayoutStepColor } from "../smart-layout-gradient";
import {
  getStaticDiagramTextAlignClass,
  type StaticDiagramElement,
} from "./diagram-static-utils";

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

export function CircularGridItemStatic(props: SlateElementProps) {
  const element = props.element as StaticDiagramElement;
  const layoutContext = useCircularGridLayoutContext();
  const path = props.path ?? props.editor.api.findPath(props.element) ?? [0];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath) as
    | TCircularGridGroupElement
    | undefined;
  const fallbackIndex = path.at(-1) ?? 0;
  const resolvedParentElement = layoutContext?.parentElement ?? parentElement;
  const index = getCircularGridItemIndex(
    resolvedParentElement,
    props.element as TCircularGridGroupElement["children"][number],
    fallbackIndex,
  );
  const total = Math.min(
    layoutContext?.total ?? resolvedParentElement?.children?.length ?? 1,
    CIRCULAR_GRID_MAX_ITEMS,
  );

  const position = getCircularGridItemPosition(index, total);
  const selfAlign = getCircularGridItemSelfAlignment(index, total);
  const transform = getCircularGridItemTransform(index, total);
  const pointerDir = getCircularGridPointerDirection(index, total);
  const bgColor = getSmartLayoutStepColor(index, total);
  const isVisible = isVisibleCircularGridItem(index);

  return (
    <SlateElement
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
          getStaticDiagramTextAlignClass(
            element.alignment ??
              layoutContext?.alignment ??
              resolvedParentElement?.alignment,
          ),
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
    </SlateElement>
  );
}
