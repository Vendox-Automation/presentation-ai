"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { CIRCULAR_GRID_MAX_ITEMS } from "../../lib";
import { type TCircularGridGroupElement } from "../../plugins/diagram-components-plugin";
import { CircularGridLayoutProvider } from "../circular-grid";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "../diagram-fit";
import { getSmartLayoutStepColor } from "../smart-layout-gradient";
import {
  getStaticDiagramJustifyClass,
  type StaticDiagramElement,
} from "./diagram-static-utils";

const CIRCULAR_GRID_LAYOUT_WIDTH_PX = 640;
const CIRCULAR_GRID_LAYOUT_HEIGHT_PX = 520;
const CIRCLE_SIZE_PX = 128;
const ITEM_COLUMN_WIDTH_PX = 220;
const ITEM_COLUMN_GAP_PX = 160;
const ITEM_ROW_GAP_PX = 56;

export default function CircularGridStatic(props: SlateElementProps) {
  const element = props.element as TCircularGridGroupElement &
    StaticDiagramElement;
  const alignment = element.alignment ?? "center";
  const total = Math.min(
    element.children?.length || 1,
    CIRCULAR_GRID_MAX_ITEMS,
  );
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(
      CIRCULAR_GRID_LAYOUT_WIDTH_PX,
      CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
    );

  return (
    <SlateElement {...props} className="my-4">
      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-visible",
          getStaticDiagramJustifyClass(alignment),
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
            className="relative"
            style={{
              ...fitStyle,
              minHeight: CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
            }}
          >
            <div
              className="grid gap-4"
              style={{
                alignContent: "center",
                columnGap: ITEM_COLUMN_GAP_PX,
                gridTemplateColumns: `repeat(2, ${ITEM_COLUMN_WIDTH_PX}px)`,
                gridTemplateRows: "repeat(3, minmax(96px, auto))",
                height: CIRCULAR_GRID_LAYOUT_HEIGHT_PX,
                justifyContent: "center",
                rowGap: ITEM_ROW_GAP_PX,
              }}
            >
              <CircularGridLayoutProvider
                value={{ alignment, parentElement: element, total }}
              >
                {props.children}
              </CircularGridLayoutProvider>

              {/* Center circle */}
              <div
                className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
                style={{
                  width: "100%",
                  height: "100%",
                }}
                data-bg-export="true"
              >
                <div
                  className="absolute rounded-full opacity-30"
                  style={{
                    width: CIRCLE_SIZE_PX + 16,
                    height: CIRCLE_SIZE_PX + 16,
                    background: getSmartLayoutStepColor(
                      Math.floor(total / 2),
                      total,
                    ),
                  }}
                  aria-hidden="true"
                  data-decor="true"
                />
                <div
                  className="grid place-items-center rounded-full px-4 text-center text-lg font-semibold text-(--presentation-card-background)"
                  style={{
                    width: CIRCLE_SIZE_PX,
                    height: CIRCLE_SIZE_PX,
                    background: getSmartLayoutStepColor(
                      Math.floor(total / 2),
                      total,
                    ),
                  }}
                >
                  {element.centerText ?? "Smart Diagram"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
