"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { useForceUpdateChildrenOnLengthChange } from "@/hooks/presentation/useForceUpdateChildrenOnLengthChange";
import { cn } from "@/lib/utils";
import { type TSnakeGroupElement } from "../plugins/diagram-components-plugin";
import { getAlignmentClasses } from "../utils";
import { getDiagramFitFrameStyle, useDiagramFitScale } from "./diagram-fit";
import { getSmartLayoutStepColor } from "./smart-layout-gradient";
import {
  buildSnakeArrowPath,
  getSnakeArrowBaselineY,
  getSnakeArrowEndX,
  getSnakeArrowStartX,
  getSvgWidth,
  SNAKE_COL_WIDTH,
  SNAKE_EDGE_PADDING_X,
  SNAKE_END_ARROW_LENGTH,
  SNAKE_GRID_ROWS,
  SNAKE_LAYOUT_HEIGHT_PX,
  SNAKE_START_DOT_GAP,
  SNAKE_START_DOT_RADIUS,
  SNAKE_SVG_HEIGHT,
} from "./snake-shared";

export default function Snake(props: PlateElementProps<TSnakeGroupElement>) {
  const { alignment = "center" } = props.element;
  const total = props.element.children.length || 1;
  const svgWidth = getSvgWidth(total);
  const layoutWidth = svgWidth + SNAKE_EDGE_PADDING_X * 2;
  const startBaselineY = getSnakeArrowBaselineY(0);
  const endBaselineY = getSnakeArrowBaselineY(total - 1);
  const { containerRef, fitStyle, frameStyle, layoutRef } =
    useDiagramFitScale<HTMLDivElement>(layoutWidth, SNAKE_LAYOUT_HEIGHT_PX);

  useForceUpdateChildrenOnLengthChange(props.editor, props.element);

  return (
    <PlateElement {...props} className="my-4">
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
            className="relative overflow-visible"
            style={{
              ...fitStyle,
              height: SNAKE_LAYOUT_HEIGHT_PX,
            }}
          >
            {/* SVG decorations: alternating arrow lanes */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              viewBox={`${-SNAKE_EDGE_PADDING_X} 0 ${layoutWidth} ${SNAKE_SVG_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              data-decor="true"
            >
              <defs>
                <marker
                  id="presentation-snake-arrow"
                  markerHeight="10"
                  markerWidth="10"
                  orient="auto"
                  refX="8"
                  refY="5"
                  viewBox="0 0 10 10"
                >
                  <path
                    d="M 1 1 L 9 5 L 1 9"
                    fill="none"
                    stroke="context-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.4"
                  />
                </marker>
              </defs>

              {/* Start dot before first item */}
              <circle
                cx={
                  getSnakeArrowStartX(0) -
                  SNAKE_START_DOT_GAP -
                  SNAKE_START_DOT_RADIUS
                }
                cy={startBaselineY}
                r={SNAKE_START_DOT_RADIUS}
                fill={getSmartLayoutStepColor(0, total)}
              />
              <line
                x1={
                  getSnakeArrowStartX(0) -
                  SNAKE_START_DOT_GAP -
                  SNAKE_START_DOT_RADIUS
                }
                y1={startBaselineY}
                x2={getSnakeArrowStartX(0)}
                y2={startBaselineY}
                stroke={getSmartLayoutStepColor(0, total)}
                strokeLinecap="round"
                strokeWidth="3"
              />

              {Array.from({ length: total }).map((_, index) => {
                const isLast = index === total - 1;

                return (
                  <path
                    key={`snake-arrow-${index}`}
                    d={buildSnakeArrowPath(index)}
                    fill="none"
                    markerEnd={
                      isLast ? undefined : "url(#presentation-snake-arrow)"
                    }
                    stroke={getSmartLayoutStepColor(index, total)}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                );
              })}

              {/* End arrow after last item */}
              {total > 0 && (
                <line
                  x1={getSnakeArrowEndX(total - 1)}
                  y1={endBaselineY}
                  x2={getSnakeArrowEndX(total - 1) + SNAKE_END_ARROW_LENGTH}
                  y2={endBaselineY}
                  stroke={getSmartLayoutStepColor(total - 1, total)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  markerEnd="url(#presentation-snake-arrow)"
                />
              )}
            </svg>

            {/* CSS Grid layout for the text items */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${total}, ${SNAKE_COL_WIDTH}px)`,
                gridTemplateRows: `repeat(${SNAKE_GRID_ROWS}, 1fr)`,
                left: SNAKE_EDGE_PADDING_X,
                width: svgWidth,
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
