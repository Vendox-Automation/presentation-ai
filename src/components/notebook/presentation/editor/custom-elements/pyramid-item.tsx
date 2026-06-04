// custom-elements/pyramid-item.tsx
"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { useEffect, useRef, useState } from "react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
  type TPyramidGroupElement,
  type TPyramidItemElement,
} from "../plugins/pyramid-plugin";
import { getPresentationAccentColor } from "./color-utils";
import {
  getPyramidBorderExtension,
  getPyramidSegmentClipPath,
  getPyramidTextOffset,
} from "./pyramid-geometry";
import { usePyramidHeight } from "./pyramid-height-context";
import { getSiblingIndexContext } from "./sibling-index";

// PyramidItem component for individual items in the pyramid
export const PyramidItem = (props: PlateElementProps<TPyramidItemElement>) => {
  // Get the parent pyramid element to access totalChildren
  const { index, parentElement } = getSiblingIndexContext<TPyramidGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TPyramidGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;

  // Get total items from parent element, fallback to calculating from parent's children
  const totalItems = resolvedParentElement?.children?.length || 1;
  const isFunnel = resolvedParentElement?.isFunnel;

  const alignment = resolvedParentElement?.alignment;
  // Refs and state for dynamic height
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(80);
  const { maxShapeHeight, registerItemHeight, unregisterItemHeight } =
    usePyramidHeight();
  const itemKey = props.path.join(".");

  // ResizeObserver to dynamically adjust height based on content height
  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      const currentContentHeight = contentRef.current?.offsetHeight ?? 80;
      const nextHeight = Math.max(currentContentHeight, 80);
      setContentHeight(nextHeight);
      registerItemHeight(itemKey, nextHeight);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
      unregisterItemHeight(itemKey);
    };
  }, [itemKey, registerItemHeight, unregisterItemHeight]);

  const shapeHeight = maxShapeHeight ?? contentHeight;

  const geometryOptions = { index, totalItems, isFunnel };
  const clipPath = getPyramidSegmentClipPath(geometryOptions);
  const leftOffset = getPyramidTextOffset(geometryOptions);
  const borderExtension = getPyramidBorderExtension(geometryOptions);

  const contentGap = "2.5rem";
  const { icon } = props.element;
  const markerColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-smart-layout)",
  );

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  const variant = resolvedParentElement?.variant;
  const isInside = variant === "inside";

  // For inside variant, offset the geometry so segments start wider (no pointy tip).
  // Offset of 3 means the first visible segment acts as index 3 in a larger pyramid.
  // Dynamic offset ensures the narrowest (top) segment is at least 45% wide.
  // For funnel, the top is already wide, so we don't offset the index, but we
  // still use the larger totalItems so the bottom doesn't end in a point.
  const insideOffset = Math.max(3, Math.ceil((45 * totalItems) / 55));
  const effectiveIndex = isFunnel ? index : index + insideOffset;
  const effectiveTotal = totalItems + insideOffset;
  const insideGeometryOptions = {
    index: effectiveIndex,
    totalItems: effectiveTotal,
    isFunnel,
  };
  const insideClipPath = getPyramidSegmentClipPath(insideGeometryOptions);

  // Compute horizontal padding so text stays within the narrowest edge of the trapezoid.
  // For pyramid the top is narrowest; for funnel the bottom is narrowest.
  const increment = 50 / effectiveTotal;
  const textInsetPercent = isFunnel
    ? 50 - increment * (effectiveTotal - effectiveIndex - 1) // funnel: bottom is narrow
    : 50 - increment * effectiveIndex; // pyramid: top is narrow
  // Add 1% breathing room
  const insidePadding = `${textInsetPercent + 1}%`;

  // For inside variant, the shape spans the full width.
  // All items share the same height via PyramidHeightProvider (maxShapeHeight).
  if (isInside) {
    return (
      <PlateElement
        {...props}
        className={cn("group/pyramid-item relative h-full w-full")}
      >
        <div className="relative w-full">
          <div
            data-decor="true"
            className="relative flex flex-col items-center justify-center border-b border-(--presentation-card-background)"
            style={
              {
                height: `${shapeHeight}px`,
                clipPath: insideClipPath,
                backgroundColor: markerColor,
                color: "var(--presentation-background)",
                "--presentation-heading": "var(--presentation-card-background)",
                "--presentation-text": "var(--presentation-card-background)",
              } as React.CSSProperties
            }
          >
            {/* Content inside the shape, padded to fit within the trapezoid */}
            <div
              ref={contentRef}
              className="relative z-10 w-full py-4 text-center"
              style={{
                paddingLeft: insidePadding,
                paddingRight: insidePadding,
              }}
            >
              {props.children}
            </div>
          </div>
        </div>
      </PlateElement>
    );
  }

  return (
    <PlateElement
      {...props}
      className={cn("group/pyramid-item relative h-full w-full")}
    >
      {/* The pyramid item layout */}
      <div
        className={cn(
          "grid h-full auto-cols-fr grid-flow-col items-center",
          alignment === "right" && "col-start-2",
        )}
      >
        {/* Shape with number */}
        <div className="relative flex-1">
          <div
            data-decor="true"
            className="grid place-items-center border-b border-(--presentation-card-background) text-2xl font-bold"
            style={{
              height: `${shapeHeight}px`,
              clipPath: clipPath,
              backgroundColor: markerColor,
              color: "var(--presentation-background)",
            }}
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
        </div>

        <div
          className={cn(
            "relative flex h-full flex-1 items-center after:absolute after:bottom-0 after:h-px after:bg-(--presentation-card-background) after:content-['']",
            alignment === "right"
              ? "after:-right-(--border-extension) after:left-0"
              : "after:right-0 after:-left-(--border-extension)",
            alignment === "right" && "col-start-1 justify-end",
          )}
          style={
            {
              "--border-extension": `${borderExtension}%`,
              transform:
                alignment === "right"
                  ? `translateX(${leftOffset}%)`
                  : `translateX(-${leftOffset}%)`,
              paddingLeft: isFunnel
                ? alignment === "right"
                  ? `0`
                  : contentGap
                : alignment === "right"
                  ? `0`
                  : contentGap,
              paddingRight: isFunnel
                ? alignment === "right"
                  ? contentGap
                  : `0`
                : alignment === "right"
                  ? contentGap
                  : `0`,
            } as React.CSSProperties
          }
        >
          <div ref={contentRef} className="grid w-max items-center px-3">
            {props.children}
          </div>
        </div>
      </div>
    </PlateElement>
  );
};
