"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";
import { useId } from "react";

import { cn } from "@/lib/utils";
import { columnSizeVariant, getDefaultColumnSize } from "../../utils";
import {
  ALTERNATING_BOX_COLUMN_GAP_PX,
  ALTERNATING_BOX_MIN_ROW_HEIGHT_PX,
  ALTERNATING_BOX_ROW_GAP_PX,
  getAlternatingBoxPlacementCss,
  useAlternatingBoxFitScale,
} from "../alternating-box-layout";
import { getDiagramFitFrameStyle } from "../diagram-fit";
import { getStaticDiagramJustifyClass } from "./diagram-static-utils";

export default function BoxGroupStatic(props: SlateElementProps) {
  const alternatingLayoutId = useId();
  const { columnSize: explicitColumnSize, boxType = "solid" } =
    props.element as {
      columnSize?: "sm" | "md" | "lg" | "xl";
      boxType?: string;
      alignment?: "left" | "center" | "right";
    };
  const element = props.element as {
    alignment?: "left" | "center" | "right";
    children?: unknown[];
    orientation?: "horizontal" | "vertical";
  };
  const alignment = element.alignment ?? "center";
  const columnSize =
    explicitColumnSize ?? getDefaultColumnSize(element.children?.length ?? 0);
  const orientation = element.orientation ?? "horizontal";
  const isAlternating = boxType === "alternating";
  const alternatingItemCount = Math.max(element.children?.length ?? 0, 1);
  const alternatingPlacementCss = getAlternatingBoxPlacementCss(
    alternatingLayoutId,
    alternatingItemCount,
    orientation,
  );
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useAlternatingBoxFitScale<HTMLDivElement>(
      alternatingItemCount,
      orientation,
    );

  if (isAlternating) {
    return (
      <SlateElement {...props} className="mb-4">
        <div
          ref={containerRef}
          className={cn(
            "flex w-full overflow-visible",
            getStaticDiagramJustifyClass(alignment),
          )}
        >
          <div
            style={{
              ...frameStyle,
              ...getDiagramFitFrameStyle(alignment),
            }}
          >
            <style>{alternatingPlacementCss}</style>
            <div ref={layoutRef} className="relative" style={fitStyle}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute rounded-full"
                data-decor="true"
                style={{
                  background:
                    "color-mix(in oklch, var(--presentation-smart-layout, var(--presentation-primary)) 72%, transparent)",
                  boxShadow:
                    "0 0 0 1px color-mix(in oklch, var(--presentation-background) 65%, transparent)",
                  ...(orientation === "vertical"
                    ? {
                        bottom: 0,
                        left: "50%",
                        top: 0,
                        transform: "translateX(-50%)",
                        width: 2,
                        zIndex: 20,
                      }
                    : {
                        height: 2,
                        left: 0,
                        right: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 20,
                      }),
                }}
              />
              <div
                className="relative z-10 grid items-stretch *:min-w-0"
                data-alternating-box-layout={alternatingLayoutId}
                style={{
                  columnGap: ALTERNATING_BOX_COLUMN_GAP_PX,
                  gridTemplateColumns:
                    orientation === "vertical"
                      ? "repeat(2, minmax(0, 1fr))"
                      : `repeat(${alternatingItemCount}, minmax(0, 1fr))`,
                  gridTemplateRows:
                    orientation === "vertical"
                      ? `repeat(${alternatingItemCount}, minmax(${ALTERNATING_BOX_MIN_ROW_HEIGHT_PX}px, auto))`
                      : `repeat(2, minmax(${ALTERNATING_BOX_MIN_ROW_HEIGHT_PX}px, 1fr))`,
                  rowGap: ALTERNATING_BOX_ROW_GAP_PX,
                }}
              >
                {props.children}
              </div>
            </div>
          </div>
        </div>
      </SlateElement>
    );
  }

  return (
    <SlateElement {...props} className="mb-4">
      <div
        className={cn(
          "max-w-full items-stretch *:flex *:min-w-0",
          columnSizeVariant({ columnSize }),
          boxType === "joined" || boxType === "joined-icon" ? "" : "gap-4",
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
