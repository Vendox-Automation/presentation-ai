"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TStairGroupElement } from "../plugins/staircase-plugin";

export default function Staircase(
  props: PlateElementProps<TStairGroupElement>,
) {
  const { alignment = "center" } = props.element;

  return (
    <PlateElement {...props} className="relative">
      {/* Container for alignment control */}
      <div
        className={cn(
          "my-0 flex w-full",
          // Apply alignment to the container, not the staircase structure
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {/* Staircase structure - always full width, vertical flow */}
        <div className="flex w-full flex-col gap-2">{props.children}</div>
      </div>
    </PlateElement>
  );
}
