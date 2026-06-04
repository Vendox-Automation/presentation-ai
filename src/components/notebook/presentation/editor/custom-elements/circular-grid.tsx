"use client";

import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";
import { createContext, useMemo, use, type ReactNode } from "react";
import TextareaAutosize from "react-textarea-autosize";

import { useForceUpdateChildrenOnLengthChange } from "@/hooks/presentation/useForceUpdateChildrenOnLengthChange";
import { cn } from "@/lib/utils";
import { CIRCULAR_GRID_MAX_ITEMS } from "../lib";
import { type TCircularGridGroupElement } from "../plugins/diagram-components-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "./diagram-fit";
import { getSmartLayoutStepColor } from "./smart-layout-gradient";

const CIRCULAR_GRID_LAYOUT_WIDTH_PX = 640;
const CIRCULAR_GRID_LAYOUT_HEIGHT_PX = 520;
const CIRCLE_SIZE_PX = 128;
const ITEM_COLUMN_WIDTH_PX = 220;
const ITEM_COLUMN_GAP_PX = 160;
const ITEM_ROW_GAP_PX = 56;
export type CircularGridLayoutContextValue = {
  alignment: "left" | "center" | "right";
  parentElement: Pick<TCircularGridGroupElement, "alignment" | "children">;
  total: number;
};

export const CircularGridLayoutContext =
  createContext<CircularGridLayoutContextValue | null>(null);

export function CircularGridLayoutProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: CircularGridLayoutContextValue;
}) {
  return (
    <CircularGridLayoutContext.Provider value={value}>
      {children}
    </CircularGridLayoutContext.Provider>
  );
}

export default function CircularGrid(
  props: PlateElementProps<TCircularGridGroupElement>,
) {
  const readOnly = useReadOnly();
  const { alignment = "center", centerText = "Smart Diagram" } = props.element;
  const total = Math.min(
    props.element.children.length || 1,
    CIRCULAR_GRID_MAX_ITEMS,
  );
  const accentColor = getPresentationAccentColor(
    props.element,
    undefined,
    getSmartLayoutStepColor(Math.floor(total / 2), total),
  );
  const layoutContextValue = useMemo<CircularGridLayoutContextValue>(
    () => ({
      alignment,
      parentElement: props.element,
      total,
    }),
    [alignment, props.element, total],
  );
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      CIRCULAR_GRID_LAYOUT_WIDTH_PX,
      CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
    );

  useForceUpdateChildrenOnLengthChange(props.editor, props.element);

  return (
    <PlateElement {...props} className="relative my-4">
      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-visible",
          getAlignmentClasses(alignment),
        )}
      >
        <div
          style={{
            ...frameStyle,
            ...getDiagramFitFrameStyle(alignment),
          }}
        >
          <div
            ref={layoutRef}
            className="relative"
            style={{
              ...fitStyle,
              minHeight: CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
            }}
          >
            <div
              className="grid gap-4"
              style={{
                alignContent: "center",
                columnGap: ITEM_COLUMN_GAP_PX,
                gridTemplateColumns: `repeat(2, ${ITEM_COLUMN_WIDTH_PX}px)`,
                gridTemplateRows: "repeat(3, minmax(96px, auto))",
                height: CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
                justifyContent: "center",
                rowGap: ITEM_ROW_GAP_PX,
              }}
            >
              {/* Render children first — they are PlateElements and must be direct children */}
              <CircularGridLayoutProvider value={layoutContextValue}>
                {props.children}
              </CircularGridLayoutProvider>

              {/* Center circle */}
              <div
                className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
                style={{
                  width: "100%",
                  height: "100%",
                }}
                data-bg-export="true"
              >
                {/* Outer glow */}
                <div
                  className="absolute rounded-full opacity-30"
                  style={{
                    width: CIRCLE_SIZE_PX + 16,
                    height: CIRCLE_SIZE_PX + 16,
                    background: accentColor,
                  }}
                  aria-hidden="true"
                  data-decor="true"
                />
                {/* Main circle */}
                <div
                  className="pointer-events-auto grid place-items-center rounded-full px-4 text-center text-lg font-semibold text-(--presentation-card-background)"
                  style={{
                    width: CIRCLE_SIZE_PX,
                    height: CIRCLE_SIZE_PX,
                    background: accentColor,
                  }}
                  contentEditable={false}
                  data-decor="true"
                  data-slate-void="true"
                >
                  {readOnly ? (
                    centerText
                  ) : (
                    <TextareaAutosize
                      value={centerText}
                      onChange={(e) => {
                        const path = props.editor.api.findPath(props.element);
                        if (path) {
                          props.editor.tf.setNodes(
                            { centerText: e.target.value },
                            { at: path },
                          );
                        }
                      }}
                      onFocus={() => {
                        props.editor.tf.blur();
                      }}
                      onBlur={(e) => {
                        const path = props.editor.api.findPath(props.element);
                        if (path) {
                          props.editor.tf.setNodes(
                            { centerText: e.target.value },
                            { at: path },
                          );
                        }
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-full resize-none bg-transparent text-center font-semibold text-(--presentation-card-background) outline-none opacity-100"
                      style={{ opacity: 1 }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlateElement>
  );
}

const ITEM_INNER_ROW_OFFSET_PX = 72;

type CircularGridChildElement = TCircularGridGroupElement["children"][number];

function getElementId(element: CircularGridChildElement): string | undefined {
  const elementId = (element as { id?: unknown }).id;

  return typeof elementId === "string" ? elementId : undefined;
}

export function useCircularGridLayoutContext() {
  const context = use(CircularGridLayoutContext);
  if (!context) {
    throw new Error(
      "useCircularGridLayoutContext must be used within a CircularGridLayoutProvider",
    );
  }
  return context;
}

export function getCircularGridItemIndex(
  parentElement: Pick<TCircularGridGroupElement, "children"> | undefined,
  element: CircularGridChildElement,
  fallbackIndex: number,
): number {
  const children = parentElement?.children;

  if (!children?.length) return fallbackIndex;

  const elementId = getElementId(element);

  if (elementId) {
    const idIndex = children.findIndex(
      (child) => getElementId(child) === elementId,
    );

    if (idIndex >= 0) return idIndex;
  }

  const referenceIndex = children.indexOf(element);

  return referenceIndex >= 0 ? referenceIndex : fallbackIndex;
}

export type CircularGridPointerDirection =
  | "bottom"
  | "bottom-right"
  | "bottom-left"
  | "right"
  | "left"
  | "top-right"
  | "top-left";

export function getCircularGridItemPosition(
  index: number,
  total: number,
): { gridRow: string; gridColumn: string } {
  const visibleIndex = Math.max(
    0,
    Math.min(index, CIRCULAR_GRID_MAX_ITEMS - 1),
  );
  const visibleTotal = Math.max(1, Math.min(total, CIRCULAR_GRID_MAX_ITEMS));

  if (visibleTotal % 2 === 1 && visibleIndex === visibleTotal - 1) {
    return {
      gridRow: "1",
      gridColumn: "1 / 3",
    };
  }

  if (visibleTotal === 4) {
    return {
      gridRow: visibleIndex < 2 ? "1" : "3",
      gridColumn: `${(visibleIndex % 2) + 1}`,
    };
  }

  const rowOffset = visibleTotal % 2 === 1 ? 2 : 1;

  return {
    gridRow: `${Math.floor(visibleIndex / 2) + rowOffset}`,
    gridColumn: `${(visibleIndex % 2) + 1}`,
  };
}

export function getCircularGridPointerDirection(
  index: number,
  total: number,
): CircularGridPointerDirection {
  const position = getCircularGridItemPosition(index, total);
  const row = parseInt(position.gridRow, 10);
  const isCentered = position.gridColumn.includes("/");
  const visibleIndex = Math.max(
    0,
    Math.min(index, CIRCULAR_GRID_MAX_ITEMS - 1),
  );
  const isLeftColumn = visibleIndex % 2 === 0;

  if (isCentered) return "bottom";
  if (row === 1) return isLeftColumn ? "bottom-right" : "bottom-left";
  if (row === 2) return isLeftColumn ? "right" : "left";
  if (row === 3) return isLeftColumn ? "top-right" : "top-left";

  return "bottom-right"; // fallback
}

export function getCircularGridItemSelfAlignment(
  index: number,
  total: number,
): {
  justifySelf: "start" | "center" | "end";
  alignSelf: "start" | "center" | "end";
} {
  const position = getCircularGridItemPosition(index, total);
  const row = parseInt(position.gridRow, 10);
  const isCentered = position.gridColumn.includes("/");
  const visibleIndex = Math.max(
    0,
    Math.min(index, CIRCULAR_GRID_MAX_ITEMS - 1),
  );
  const isLeftColumn = visibleIndex % 2 === 0;

  const justifySelf = isCentered ? "center" : isLeftColumn ? "end" : "start";
  const alignSelf: "start" | "center" | "end" =
    row === 1 ? "end" : row === 3 ? "start" : "center";

  return { justifySelf, alignSelf };
}

export function getCircularGridItemTransform(
  index: number,
  total: number,
): string | undefined {
  const pos = getCircularGridItemPosition(index, total);
  const row = parseInt(pos.gridRow, 10);
  const col = parseInt(pos.gridColumn, 10);

  if (pos.gridColumn.includes("/")) return undefined;
  if (row === 2) return undefined;

  return `translateX(${col === 1 ? ITEM_INNER_ROW_OFFSET_PX : -ITEM_INNER_ROW_OFFSET_PX}px)`;
}

export function isVisibleCircularGridItem(index: number): boolean {
  return index >= 0 && index < CIRCULAR_GRID_MAX_ITEMS;
}

