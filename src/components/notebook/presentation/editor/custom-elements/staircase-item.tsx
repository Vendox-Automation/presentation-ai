"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { useLayoutEffect, useRef, useState } from "react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
  type TStairGroupElement,
  type TStairItemElement,
} from "../plugins/staircase-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

const STAIR_MIN_BLOCK_HEIGHT = 48;

// StairItem component aligned with PyramidItem behavior
export const StairItem = (props: PlateElementProps<TStairItemElement>) => {
  // Derive parent stair element and totalChildren like pyramid
  const { index, parentElement } = getSiblingIndexContext<TStairGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TStairGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;

  const totalItems = resolvedParentElement?.children?.length || 1;

  // Refs and state for dynamic height
  const contentRef = useRef<HTMLDivElement>(null);
  const [blockHeight, setBlockHeight] = useState(STAIR_MIN_BLOCK_HEIGHT);

  // ResizeObserver to dynamically adjust height based on content height
  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      const contentHeight =
        contentRef.current?.getBoundingClientRect().height ??
        STAIR_MIN_BLOCK_HEIGHT;
      const nextHeight = Math.max(
        Math.ceil(contentHeight),
        STAIR_MIN_BLOCK_HEIGHT,
      );

      setBlockHeight((currentHeight) =>
        Math.abs(currentHeight - nextHeight) > 0.5 ? nextHeight : currentHeight,
      );
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Calculate a width ramp similar to previous design, but driven by totalItems
  const baseWidth = 70;
  const maxWidth = 220;
  const increment = (maxWidth - baseWidth) / (totalItems - 1 || 1);
  const widthPx = baseWidth + index * increment;

  const alignment =
    props.element.alignment ?? resolvedParentElement?.alignment ?? "left";
  const { icon } = props.element;
  const markerColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-smart-layout, var(--presentation-primary))",
  );

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  const variant = resolvedParentElement?.variant;
  const isInside = variant === "inside";

  // For inside variant, use percentage-based widths so they scale with container
  const baseWidthPercent = 30;
  const maxWidthPercent = 70;
  const incrementPercent =
    (maxWidthPercent - baseWidthPercent) / (totalItems - 1 || 1);
  const widthPercent = baseWidthPercent + index * incrementPercent;

  if (isInside) {
    return (
      <PlateElement
        {...props}
        className={cn("group/stair-item relative w-full")}
      >
        <div
          className={cn(
            "flex w-full border-b border-gray-700",
            alignment === "right" && "justify-end",
            alignment !== "right" && "justify-start",
          )}
        >
          <div
            data-shape="rect"
            data-shape-text={String(index + 1)}
            data-fill-color={markerColor}
            data-text-color="var(--presentation-background)"
            style={
              {
                width: `${widthPercent}%`,
                backgroundColor: markerColor,
                color: "var(--presentation-background)",
                "--presentation-heading": "var(--presentation-card-background)",
                "--presentation-text": "var(--presentation-card-background)",
              } as React.CSSProperties
            }
            className="flex min-h-15 shrink-0 flex-col justify-center rounded-md px-4 py-3"
          >
            <div ref={contentRef} className="w-full font-normal">
              {props.children}
            </div>
          </div>
        </div>
      </PlateElement>
    );
  }

  return (
    <PlateElement {...props} className={cn("group/stair-item relative w-full")}>
      <div
        className={cn(
          "flex items-center gap-4 border-b border-gray-700",
          alignment === "right" && "flex-row-reverse",
        )}
      >
        {/* Width-growing block with number */}
        <div
          data-shape="rect"
          data-shape-text={String(index + 1)}
          data-fill-color={markerColor}
          data-text-color="var(--presentation-background)"
          style={{
            width: `${widthPx}px`,
            height: `${blockHeight}px`,
            backgroundColor: markerColor,
            color: "var(--presentation-background)",
          }}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md text-2xl font-bold",
          )}
        >
          <IconPicker
            defaultIcon={icon}
            placeholder={
              <span className="text-2xl font-bold">{index + 1}</span>
            }
            onIconSelect={(iconName) => handleIconSelect(iconName)}
            onIconRemove={() => {
              const itemPath = props.editor.api.findPath(props.element);
              if (!itemPath) return;
              props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
            }}
            className="h-full w-full border-transparent bg-transparent shadow-none hover:bg-white/15"
            size="lg"
            style={{
              borderColor: "transparent",
              backgroundColor: "transparent",
              color: "var(--presentation-background)",
            }}
          />
        </div>

        <div
          ref={contentRef}
          className={cn(
            "min-w-0 flex-1 self-center",
            getAlignmentClasses(alignment),
          )}
        >
          {props.children}
        </div>
      </div>
    </PlateElement>
  );
};
