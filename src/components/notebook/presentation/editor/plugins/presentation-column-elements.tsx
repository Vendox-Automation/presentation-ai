"use client";

import {
  NodeApi,
  PathApi,
  type TColumnElement,
  type TColumnGroupElement,
} from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

const MIN_COLUMN_WIDTH_PERCENT = 10;

function parseColumnWidth(width: unknown, fallback: number) {
  if (width === undefined || width === null) return fallback;

  const parsedWidth = Number.parseFloat(String(width));

  return Number.isFinite(parsedWidth) && parsedWidth > 0
    ? parsedWidth
    : fallback;
}

function roundColumnWidth(width: number): number {
  return Math.round(width * 100) / 100;
}

function formatColumnWidth(width: number) {
  return `${roundColumnWidth(width)}%`;
}

function clampColumnWidth(width: number, min: number, max: number) {
  return Math.min(Math.max(width, min), max);
}

function getColumnWidths(columns: TColumnElement[]) {
  const fallbackWidth = 100 / columns.length;

  return columns.map((column) => parseColumnWidth(column.width, fallbackWidth));
}

function getGridTemplateColumns(columns: TColumnElement[]): CSSProperties {
  if (columns.length === 0) {
    return {};
  }

  return {
    gridTemplateColumns: getColumnWidths(columns)
      .map((width) => `minmax(0, ${formatColumnWidth(width)})`)
      .join(" "),
  };
}

export function PresentationColumnGroupElement(
  props: PlateElementProps<TColumnGroupElement>,
) {
  return (
    <PlateElement className="mb-2" {...props}>
      <div
        className="grid w-full rounded"
        data-presentation-column-grid
        style={getGridTemplateColumns(props.element.children)}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}

export function PresentationColumnElement(
  props: PlateElementProps<TColumnElement>,
) {
  const readOnly = useReadOnly();
  const columnIndex = props.path.at(-1);
  const parentPath = PathApi.parent(props.path);
  const parentElement = NodeApi.get(props.editor, parentPath) as
    | TColumnGroupElement
    | undefined;
  const columns = parentElement?.children ?? [];
  const isLastColumn =
    typeof columnIndex !== "number" || columnIndex >= columns.length - 1;

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (readOnly || typeof columnIndex !== "number" || isLastColumn) return;

    const gridElement = event.currentTarget.closest<HTMLElement>(
      "[data-presentation-column-grid]",
    );
    const groupWidth = gridElement?.getBoundingClientRect().width ?? 0;

    if (groupWidth <= 0) return;

    event.preventDefault();
    event.stopPropagation();

    const widths = getColumnWidths(columns);
    const initialCurrentWidth = widths[columnIndex] ?? 0;
    const initialNextWidth = widths[columnIndex + 1] ?? 0;
    const pairedWidth = initialCurrentWidth + initialNextWidth;
    const maxCurrentWidth = Math.max(
      MIN_COLUMN_WIDTH_PERCENT,
      pairedWidth - MIN_COLUMN_WIDTH_PERCENT,
    );
    const startX = event.clientX;
    const applyPreviewWidths = (nextWidths: number[]) => {
      if (!gridElement) return;

      gridElement.style.gridTemplateColumns = nextWidths
        .map((width) => `minmax(0, ${formatColumnWidth(width)})`)
        .join(" ");
    };

    const getNextWidths = (clientX: number) => {
      const deltaPercent = ((clientX - startX) / groupWidth) * 100;
      const nextCurrentWidth = clampColumnWidth(
        initialCurrentWidth + deltaPercent,
        MIN_COLUMN_WIDTH_PERCENT,
        maxCurrentWidth,
      );
      const nextSiblingWidth = Math.max(
        MIN_COLUMN_WIDTH_PERCENT,
        pairedWidth - nextCurrentWidth,
      );

      return widths.map((width, index) => {
        if (index === columnIndex) return nextCurrentWidth;
        if (index === columnIndex + 1) return nextSiblingWidth;
        return width;
      });
    };

    const handlePointerMove = (pointerMoveEvent: PointerEvent) => {
      applyPreviewWidths(getNextWidths(pointerMoveEvent.clientX));
    };

    const handlePointerUp = (pointerUpEvent: PointerEvent) => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      const finalWidths = getNextWidths(pointerUpEvent.clientX).map(
        roundColumnWidth,
      );

      props.editor.tf.withoutNormalizing(() => {
        finalWidths.forEach((width, index) => {
          props.editor.tf.setNodes(
            { width: formatColumnWidth(width) },
            { at: [...parentPath, index] },
          );
        });
      });
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  return (
    <div className="group/column relative min-w-0">
      <PlateElement
        {...props}
        className="min-w-0 px-2 group-first/column:pl-0 group-last/column:pr-0"
      >
        <div className="relative min-w-0 border border-transparent p-1.5">
          {props.children}
        </div>
      </PlateElement>
      {!readOnly && !isLastColumn && (
        <button
          aria-label="Resize column"
          className={cn(
            "absolute top-0 -right-1 z-20 h-full w-2 cursor-col-resize touch-none select-none",
            "before:absolute before:top-2 before:right-1/2 before:bottom-2 before:w-0.75 before:translate-x-1/2 before:rounded-full before:bg-(--presentation-primary)/70 before:opacity-0 before:transition-opacity",
            "hover:before:opacity-100 focus-visible:before:opacity-100 group-hover/column:before:opacity-100",
          )}
          contentEditable={false}
          onPointerDown={handlePointerDown}
          type="button"
        />
      )}
    </div>
  );
}
