"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "../diagram-fit";
import {
  getStaticDiagramJustifyClass,
  type StaticDiagramElement,
} from "./diagram-static-utils";

const SLOPE_LAYOUT_WIDTH_PX = 1024;
const SLOPE_MIN_LAYOUT_HEIGHT_PX = 455;

export default function SlopeStatic(props: SlateElementProps) {
  const element = props.element as StaticDiagramElement;
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      SLOPE_LAYOUT_WIDTH_PX,
      SLOPE_MIN_LAYOUT_HEIGHT_PX,
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
            className={cn(
              "flex items-stretch gap-3 overflow-visible py-6",
              getStaticDiagramJustifyClass(element.alignment),
            )}
            style={fitStyle}
          >
            {props.children}
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
