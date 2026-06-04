"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  CONNECTED_CIRCLE_GAP_PX,
  CONNECTED_CIRCLE_SIZE_PX,
} from "../connected-circles-layout";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "../diagram-fit";
import {
  getStaticDiagramJustifyClass,
  type StaticDiagramElement,
} from "./diagram-static-utils";

const CONNECTED_CIRCLES_LAYOUT_WIDTH_PX =
  CONNECTED_CIRCLE_SIZE_PX * 2 + CONNECTED_CIRCLE_GAP_PX;
const CONNECTED_CIRCLES_MIN_LAYOUT_HEIGHT_PX =
  CONNECTED_CIRCLE_SIZE_PX * 2 + CONNECTED_CIRCLE_GAP_PX + 32;

export default function ConnectedCirclesStatic(props: SlateElementProps) {
  const element = props.element as StaticDiagramElement;
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      CONNECTED_CIRCLES_LAYOUT_WIDTH_PX,
      CONNECTED_CIRCLES_MIN_LAYOUT_HEIGHT_PX,
    );

  return (
    <SlateElement {...props} className="my-4">
      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-visible",
          getStaticDiagramJustifyClass(element.alignment),
        )}
      >
        <div
          style={{
            ...frameStyle,
            ...getDiagramFitFrameStyle(element.alignment),
          }}
        >
          <div
            ref={layoutRef}
            className="relative inline-grid place-items-center gap-1 overflow-visible py-4"
            style={{
              ...fitStyle,
              alignContent: "center",
              gridAutoRows: CONNECTED_CIRCLE_SIZE_PX,
              gridTemplateColumns: `repeat(2, ${CONNECTED_CIRCLE_SIZE_PX}px)`,
              minHeight: CONNECTED_CIRCLES_MIN_LAYOUT_HEIGHT_PX,
            }}
          >
            {props.children}
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
