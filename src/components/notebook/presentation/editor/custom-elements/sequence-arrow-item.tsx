"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TSequenceArrowGroupElement } from "../plugins/sequence-arrow-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

export const SequenceArrowItem = (props: PlateElementProps) => {
  const { index, parentElement } =
    getSiblingIndexContext<TSequenceArrowGroupElement>(
      props.editor,
      props.element,
      props.path,
    );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TSequenceArrowGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;
  const total = resolvedParentElement?.children?.length ?? 0;
  const isLast = index === total - 1;

  const { orientation = "vertical" } = resolvedParentElement ?? {};
  const triangleColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-card-background, var(--presentation-primary))",
  );
  return (
    <PlateElement
      {...props}
      className={cn(
        "relative h-full w-full flex-1",
        orientation === "horizontal" && "flex items-stretch",
      )}
      style={{ pointerEvents: "none" }}
    >
      <div
        className={cn(
          "grid w-full rounded-xl p-6 shadow-lg",
          orientation === "horizontal" && "flex-1",
        )}
        data-bg-export="true"
        style={{
          backgroundColor: triangleColor,
          color: "var(--presentation-background)",
        }}
      >
        <div
          className={cn(getAlignmentClasses(resolvedParentElement?.alignment))}
        >
          {props.children}
        </div>
      </div>

      {!isLast && orientation === "vertical" && (
        <div
          data-decor="true"
          className={cn("mx-auto h-0 w-0")}
          style={{
            borderLeft: "13px solid transparent",
            borderRight: "13px solid transparent",
            borderTop: `19px solid ${triangleColor}`,
            filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.08))",
          }}
        />
      )}

      {!isLast && orientation === "horizontal" && (
        <div
          data-decor="true"
          className={cn("my-auto h-0 w-0")}
          style={{
            borderTop: "13px solid transparent",
            borderBottom: "13px solid transparent",
            borderLeft: `19px solid ${triangleColor}`,
            filter: "drop-shadow(6px 0 8px rgba(0,0,0,0.08))",
          }}
        />
      )}
    </PlateElement>
  );
};
