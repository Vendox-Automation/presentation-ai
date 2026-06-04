"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import {
  columnSizeVariant,
  getDefaultColumnSize,
  type PresentationColumnSize,
} from "../utils";

export default function CompareGroup(props: PlateElementProps) {
  const { alignment = "center" } = props.element;
  const columnSize =
    (props.element.columnSize as PresentationColumnSize | undefined) ??
    getDefaultColumnSize(props.element.children?.length ?? 0);

  return (
    <PlateElement {...props} className="relative">
      <div
        className={cn(
          "relative mb-4 max-w-full items-stretch gap-6 *:min-w-0",
          columnSizeVariant({ columnSize }),
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
