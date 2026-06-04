"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TFlexBoxElement } from "../plugins/flex-box-plugin";

const GAP_CLASS_BY_SIZE = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
  xl: "gap-12",
  none: "gap-0",
} as const;

const JUSTIFY_CLASS_BY_VALUE = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
} as const;

const ALIGN_CLASS_BY_VALUE = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

export default function FlexBox(props: PlateElementProps<TFlexBoxElement>) {
  const { align = "center", justify = "center", gap = "md" } = props.element;

  return (
    <PlateElement {...props} className="mb-4">
      <div
        className={cn(
          "flex w-full flex-wrap",
          GAP_CLASS_BY_SIZE[gap] || "gap-4",
          JUSTIFY_CLASS_BY_VALUE[justify] || "justify-center",
          ALIGN_CLASS_BY_VALUE[align] || "items-center",
        )}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
