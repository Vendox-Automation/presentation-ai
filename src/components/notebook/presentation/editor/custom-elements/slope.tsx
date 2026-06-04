"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { useForceUpdateChildrenOnLengthChange } from "@/hooks/presentation/useForceUpdateChildrenOnLengthChange";
import { cn } from "@/lib/utils";
import { type TSlopeGroupElement } from "../plugins/diagram-components-plugin";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "./diagram-fit";

const SLOPE_LAYOUT_WIDTH_PX = 1024;
const SLOPE_MIN_LAYOUT_HEIGHT_PX = 455;

function getSlopeJustifyClass(alignment: TSlopeGroupElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export default function Slope(props: PlateElementProps<TSlopeGroupElement>) {
  const { alignment = "center" } = props.element;
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      SLOPE_LAYOUT_WIDTH_PX,
      SLOPE_MIN_LAYOUT_HEIGHT_PX,
    );

  useForceUpdateChildrenOnLengthChange(props.editor, props.element);

  return (
    <PlateElement {...props} className="relative my-4">
      <div ref={containerRef} className="w-full overflow-visible">
        <div
          style={{
            ...frameStyle,
            ...getDiagramFitFrameStyle(alignment),
          }}
        >
          <div
            ref={layoutRef}
            className={cn(
              "flex items-stretch gap-3 overflow-visible py-6",
              "[&>div]:flex [&>div]:flex-col [&>div]:items-stretch",
              getSlopeJustifyClass(alignment),
            )}
            style={fitStyle}
          >
            {props.children}
          </div>
        </div>
      </div>
    </PlateElement>
  );
}
