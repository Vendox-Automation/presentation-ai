"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TStatsGroupElement } from "../plugins/stats-plugin";
import {
  columnSizeVariant,
  getAlignmentClasses,
  getDefaultColumnSize,
} from "../utils";

export default function StatsGroup(
  props: PlateElementProps<TStatsGroupElement>,
) {
  const { alignment = "left" } = props.element;
  const columnSize =
    props.element.columnSize ??
    getDefaultColumnSize(props.element.children.length);

  return (
    <PlateElement {...props} className="relative mb-4 w-full max-w-full">
      <div
        className={cn(
          "w-full max-w-full min-w-0",
          columnSizeVariant({ columnSize }),
          getAlignmentClasses(alignment),
        )}
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
