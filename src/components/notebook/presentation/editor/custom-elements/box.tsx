"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import { useId } from "react";

import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { type TBoxGroupElement } from "../plugins/box-plugin";
import { columnSizeVariant, getDefaultColumnSize } from "../utils";
import {
  ALTERNATING_BOX_COLUMN_GAP_PX,
  ALTERNATING_BOX_MIN_ROW_HEIGHT_PX,
  ALTERNATING_BOX_ROW_GAP_PX,
  getAlternatingBoxPlacementCss,
  useAlternatingBoxFitScale,
} from "./alternating-box-layout";
import { getDiagramFitFrameStyle } from "./diagram-fit";

function getBoxGroupJustifyClass(
  alignment: TBoxGroupElement["alignment"] = "center",
) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export default function BoxGroup(props: PlateElementProps<TBoxGroupElement>) {
  const isPresenting = usePresentationState((state) => state.isPresenting);
  const alternatingLayoutId = useId();
  const {
    alignment = "center",
    boxType = "solid",
    orientation = "horizontal",
  } = props.element;
  const columnSize =
    props.element.columnSize ??
    getDefaultColumnSize(props.element.children.length);
  const isAlternating = boxType === "alternating";
  const alternatingItemCount = Math.max(props.element.children.length, 1);
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
      <PlateElement {...props} className="relative mb-4">
        <div
          ref={containerRef}
          className={cn(
            "flex w-full overflow-visible",
            getBoxGroupJustifyClass(alignment),
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
      </PlateElement>
    );
  }

  return (
    <PlateElement {...props} className="relative mb-4">
      <div
        className={cn(
          "max-w-full",
          isPresenting && "items-stretch *:min-w-0",
          columnSizeVariant({ columnSize }),
          boxType === "joined" || boxType === "joined-icon" ? "" : "gap-4",
        )}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
