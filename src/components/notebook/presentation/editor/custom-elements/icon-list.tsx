"use client";

// Import IconItem and constants
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TIconListElement } from "../plugins/icon-list-plugin";
import {
  getDefaultColumnSize,
  getIconListOrientation,
  iconListColumnSizeVariant,
} from "../utils";

export function IconList({
  element,
  children,
  className,
  ref,
  ...props
}: PlateElementProps<TIconListElement>) {
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children.length);
  const orientation = getIconListOrientation(
    element.orientation,
    element.children.length,
  );

  return (
    <PlateElement
      ref={ref}
      element={element}
      className={cn("my-6", className)}
      {...props}
    >
      <div className="@container/icon-list max-w-full">
        <div
          data-icon-list-grid="true"
          className={cn(
            "gap-6",
            orientation === "top" && "items-start",
            iconListColumnSizeVariant({
              columnSize: columnSize as "sm" | "md" | "lg" | "xl",
            }),
          )}
        >
          {children}
        </div>
      </div>
    </PlateElement>
  );
}
