"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { useForceUpdateChildrenOnLengthChange } from "@/hooks/presentation/useForceUpdateChildrenOnLengthChange";
import { cn } from "@/lib/utils";
import { type TConnectedCirclesGroupElement } from "../plugins/diagram-components-plugin";
import { getAlignmentClasses } from "../utils";
import {
  CONNECTED_CIRCLE_GAP_PX,
  CONNECTED_CIRCLE_SIZE_PX,
} from "./connected-circles-layout";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "./diagram-fit";

const CONNECTED_CIRCLES_LAYOUT_WIDTH_PX =
  CONNECTED_CIRCLE_SIZE_PX * 2 + CONNECTED_CIRCLE_GAP_PX;
const CONNECTED_CIRCLES_MIN_LAYOUT_HEIGHT_PX =
  CONNECTED_CIRCLE_SIZE_PX * 2 + CONNECTED_CIRCLE_GAP_PX + 32;

export default function ConnectedCircles(
  props: PlateElementProps<TConnectedCirclesGroupElement>,
) {
  const { alignment = "center" } = props.element;
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      CONNECTED_CIRCLES_LAYOUT_WIDTH_PX,
      CONNECTED_CIRCLES_MIN_LAYOUT_HEIGHT_PX,
    );

  useForceUpdateChildrenOnLengthChange(props.editor, props.element);

  return (
    <PlateElement {...props} className="relative my-4">
      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-visible",
          getAlignmentClasses(alignment),
        )}
      >
        <div
          style={{
            ...frameStyle,
            ...getDiagramFitFrameStyle(alignment),
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
    </PlateElement>
  );
}
