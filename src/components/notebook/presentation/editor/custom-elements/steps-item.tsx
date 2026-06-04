"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { type TStepsGroupElement } from "../plugins/steps-plugin";
import { getDefaultColumnSize } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

const columnSizeToColumns: Record<string, number> = {
  sm: 4,
  md: 3,
  lg: 2,
  xl: 1,
};

export function StepsItem(props: PlateElementProps) {
  const { index, parentElement } = getSiblingIndexContext<TStepsGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TStepsGroupElement | undefined;
  const resolvedParent = parentElement ?? fallbackParentElement;

  const { variant = "default" } = resolvedParent ?? {};
  const columnSize =
    resolvedParent?.columnSize ??
    getDefaultColumnSize(resolvedParent?.children.length ?? 0);

  const columns = columnSizeToColumns[columnSize as string] ?? 3;

  const isVertical = columns === 1;

  // For horizontal layout, the column index resets per row
  const colIndex = isVertical ? index : index % columns;

  const primaryColor = getPresentationAccentColor(
    props.element,
    resolvedParent,
    "var(--presentation-smart-layout, var(--presentation-primary))",
  );

  if (!isVertical) {
    if (variant === "default") {
      // Horizontal default: top bar that climbs upward (staircase effect)
      // Items align to top, margin top decreases per column to create upward step
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <PlateElement
          {...props}
          className="relative my-0 flex h-full min-w-0 flex-col"
        >
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="mb-3 h-1.5 w-full shrink-0 rounded-full"
              data-decor="true"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex-1">{props.children}</div>
          </div>
        </PlateElement>
      );
    }

    if (variant === "arrow") {
      // Horizontal arrow: arrow SVG on top, content below
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <PlateElement
          {...props}
          className="relative my-0 flex h-full min-w-0 flex-col"
        >
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="mb-3 flex w-full shrink-0 items-center pr-4"
              data-decor="true"
              style={{ color: primaryColor }}
            >
              <div className="h-3 flex-1 bg-current" />
              <svg
                viewBox="0 0 16 24"
                className="-ml-px h-6 w-4 shrink-0 fill-current"
              >
                <path d="M0 0l16 12-16 12z" />
              </svg>
            </div>
            <div className="flex-1">{props.children}</div>
          </div>
        </PlateElement>
      );
    }

    if (variant === "box") {
      // Horizontal box: full border with left accent bar
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <PlateElement
          {...props}
          className="relative my-0 flex h-full min-w-0 flex-col"
        >
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="flex-1 rounded-lg border p-4"
              style={{
                borderLeftWidth: "6px",
                borderColor: primaryColor,
              }}
            >
              <div>{props.children}</div>
            </div>
          </div>
        </PlateElement>
      );
    }
  }

  // Vertical layout
  if (variant === "default") {
    // Vertical default: left bar with progressive indentation
    return (
      <PlateElement {...props} className="relative my-0 min-w-0">
        <div
          className="py-2 pl-4"
          style={{
            marginLeft: `${colIndex * 1.5}rem`,
            borderLeftWidth: "6px",
            borderLeftStyle: "solid",
            borderLeftColor: primaryColor,
          }}
        >
          <div>{props.children}</div>
        </div>
      </PlateElement>
    );
  }

  if (variant === "arrow") {
    // Vertical arrow: down arrow SVG with progressive indentation
    return (
      <PlateElement {...props} className="relative my-0 min-w-0">
        <div
          className="flex gap-4"
          style={{ marginLeft: `${colIndex * 1.5}rem` }}
        >
          <div
            className="flex shrink-0 flex-col items-center"
            data-decor="true"
            style={{ color: primaryColor }}
          >
            <div className="w-3 flex-1 bg-current" />
            <svg
              viewBox="0 0 24 16"
              className="-mt-px h-4 w-6 shrink-0 fill-current"
            >
              <path d="M0 0l12 16 12-16z" />
            </svg>
          </div>
          <div className="min-w-0 pb-4">{props.children}</div>
        </div>
      </PlateElement>
    );
  }

  if (variant === "box") {
    // Vertical box: full border with left accent bar, progressive indentation
    return (
      <PlateElement {...props} className="relative my-0 min-w-0">
        <div
          className="w-full rounded-lg border p-4"
          style={{
            marginLeft: `${colIndex * 1.5}rem`,
            width: `calc(100% - ${colIndex * 1.5}rem)`,
            borderLeftWidth: "6px",
            borderLeftStyle: "solid",
            borderColor: primaryColor,
          }}
        >
          <div>{props.children}</div>
        </div>
      </PlateElement>
    );
  }

  // Fallback
  return (
    <PlateElement {...props} className="relative my-0 min-w-0">
      {props.children}
    </PlateElement>
  );
}
