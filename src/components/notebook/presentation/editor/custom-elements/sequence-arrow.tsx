"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";

export default function SequenceArrow(props: PlateElementProps) {
  const { orientation, alignment = "center" } = props.element;
  return (
    <PlateElement {...props} className="relative my-4">
      {/* Container for alignment control */}
      <div
        className={cn(
          "flex w-full",
          // Apply alignment to the container, not the sequence arrow structure
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {/* Sequence arrow structure - always full width */}
        <div
          className={cn(
            "grid w-full gap-1",
            orientation === "horizontal"
              ? "auto-cols-fr grid-flow-col"
              : "grid-flow-row",
            "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
            "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
            "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
            "[&_:is(.presentation-heading)]:[background:none!important;]",
            "[&_:is(.presentation-heading)]:text-(--presentation-text)!",
          )}
        >
          {props.children}
        </div>
      </div>
    </PlateElement>
  );
}
