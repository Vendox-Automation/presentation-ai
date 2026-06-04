"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TCompareGroupElement } from "../plugins/compare-plugin";
import { getAlignmentClasses, getDefaultColumnSize } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

export const CompareSide = (props: PlateElementProps) => {
  const { index, parentElement } = getSiblingIndexContext<TCompareGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TCompareGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;

  const { alignment = "left" } = resolvedParentElement ?? {};
  const childCount = resolvedParentElement?.children?.length ?? 0;
  const columnSize =
    resolvedParentElement?.columnSize ?? getDefaultColumnSize(childCount);
  const columns = getColumnCount(columnSize);
  const isVertical = columnSize === "xl";
  const showSeparator = shouldShowSeparator({
    columns,
    index,
    itemCount: childCount,
  });

  // Calculate grid column position
  // For children: positions 1, 3, 5, 7, etc. (odd positions)
  // For VS elements: positions 2, 4, 6, 8, etc. (even positions)
  const gridColumn = index * 2 + 1;
  const accentColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-primary)",
  );
  return (
    <PlateElement
      {...props}
      className={cn(
        "relative flex h-full min-w-0 flex-1 items-stretch",
        isVertical && "flex-col items-center gap-4",
      )}
      style={{ gridColumn, order: gridColumn }}
    >
      <div
        data-bg-export="true"
        className={cn(
          "grid h-full w-full rounded-xl border bg-card p-6 shadow-md",
          "border-t-4",
        )}
        style={{
          backgroundColor: "var(--presentation-background)",
          color: "var(--presentation-text)",
          borderColor: "hsl(var(--border))",
          borderTopColor: accentColor,
        }}
      >
        <div className={cn(getAlignmentClasses(alignment))}>
          {props.children}
        </div>
      </div>
      {showSeparator ? (
        <CompareSeparator accentColor={accentColor} isVertical={isVertical} />
      ) : null}
    </PlateElement>
  );
};

function CompareSeparator({
  accentColor,
  isVertical,
}: {
  accentColor: string;
  isVertical: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center self-center",
        !isVertical && "absolute -right-9 top-1/2 z-10 -translate-y-1/2",
      )}
      aria-hidden
    >
      <div
        data-shape="ellipse"
        data-shape-text="VS"
        data-fill-color={accentColor}
        data-text-color="var(--presentation-background)"
        className="grid size-12 place-items-center rounded-full text-sm font-bold shadow-xs"
        style={{
          backgroundColor: accentColor,
          color: "var(--presentation-background)",
          pointerEvents: "none",
        }}
      >
        VS
      </div>
    </div>
  );
}

function getColumnCount(columnSize: TCompareGroupElement["columnSize"]) {
  const columnSizeToColumns = {
    lg: 2,
    md: 3,
    sm: 4,
    xl: 1,
  } satisfies Record<NonNullable<TCompareGroupElement["columnSize"]>, number>;

  return columnSize ? columnSizeToColumns[columnSize] : columnSizeToColumns.md;
}

function shouldShowSeparator({
  columns,
  index,
  itemCount,
}: {
  columns: number;
  index: number;
  itemCount: number;
}) {
  const isLastItem = index === itemCount - 1;
  const isRowEnd = (index + 1) % columns === 0;

  return !isLastItem && (columns === 1 || !isRowEnd);
}
