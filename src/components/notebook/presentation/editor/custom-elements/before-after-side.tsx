"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TBeforeAfterGroupElement } from "../plugins/before-after-plugin";
import { getAlignmentClasses, getDefaultColumnSize } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

export const BeforeAfterSide = (props: PlateElementProps) => {
  const { index, parentElement } =
    getSiblingIndexContext<TBeforeAfterGroupElement>(
      props.editor,
      props.element,
      props.path,
    );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TBeforeAfterGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;

  const { alignment = "center" } = resolvedParentElement ?? {};
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
        <BeforeAfterSeparator
          accentColor={accentColor}
          isVertical={isVertical}
        />
      ) : null}
    </PlateElement>
  );
};

function BeforeAfterSeparator({
  accentColor,
  isVertical,
}: {
  accentColor: string;
  isVertical: boolean;
}) {
  const ArrowIcon = isVertical ? ArrowDown : ArrowRight;

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
        data-shape-text={isVertical ? "↓" : "→"}
        data-fill-color={accentColor}
        data-text-color="var(--presentation-background)"
        className="grid size-12 place-items-center rounded-full text-sm font-bold shadow-xs"
        style={{
          backgroundColor: accentColor,
          color: "var(--presentation-background)",
          pointerEvents: "none",
        }}
      >
        <ArrowIcon className="size-5" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function getColumnCount(columnSize: TBeforeAfterGroupElement["columnSize"]) {
  const columnSizeToColumns = {
    lg: 2,
    md: 3,
    sm: 4,
    xl: 1,
  } satisfies Record<
    NonNullable<TBeforeAfterGroupElement["columnSize"]>,
    number
  >;

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
