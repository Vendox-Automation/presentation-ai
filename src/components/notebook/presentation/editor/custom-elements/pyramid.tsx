// custom-elements/pyramid.tsx
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TPyramidGroupElement } from "../plugins/pyramid-plugin";
import { PyramidHeightProvider } from "./pyramid-height-context";

export default function Pyramid(
  props: PlateElementProps<TPyramidGroupElement>,
) {
  const { alignment = "center" } = props.element;

  return (
    <PlateElement {...props} className="relative">
      {/* Container for alignment control */}
      <div
        className={cn(
          "my-4 mb-8 flex w-full",
          // Apply alignment to the container, not the grid
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {/* Pyramid grid - always full width */}
        <PyramidHeightProvider>
          <div className="grid w-full grid-flow-row auto-rows-fr overflow-visible">
            {props.children}
          </div>
        </PyramidHeightProvider>
      </div>
    </PlateElement>
  );
}
