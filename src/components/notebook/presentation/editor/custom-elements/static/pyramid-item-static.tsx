import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { type TPyramidGroupElement } from "../../plugins/pyramid-plugin";
import { PresentationIcon } from "../presentation-icon";
import {
  getPyramidBorderExtension,
  getPyramidSegmentClipPath,
  getPyramidTextOffset,
} from "../pyramid-geometry";
import { usePyramidHeight } from "../pyramid-height-context";

export function PyramidItemStatic(props: SlateElementProps) {
  const path = props.path ?? props.editor.api.findPath(props.element) ?? [0];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TPyramidGroupElement;

  const totalItems = parentElement?.children?.length || 1;
  const index = path.at(-1) ?? 0;
  const isFunnel = parentElement?.isFunnel;
  const alignment = parentElement?.alignment;

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(80);
  const { maxShapeHeight, registerItemHeight, unregisterItemHeight } =
    usePyramidHeight();
  const itemKey = path.join(".");

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
  const icon =
    "icon" in props.element && typeof props.element.icon === "string"
      ? props.element.icon
      : undefined;
  const markerColor =
    (parentElement?.color as string) || "var(--presentation-smart-layout)";

  const variant = parentElement?.variant;
  const isInside = variant === "inside";

  // For inside variant, offset geometry so segments start wider (min 45% top width)
  // For funnel, top is already full width, so do not offset the index.
  const insideOffset = Math.max(3, Math.ceil((45 * totalItems) / 55));
  const effectiveIndex = isFunnel ? index : index + insideOffset;
  const effectiveTotal = totalItems + insideOffset;
  const insideClipPath = getPyramidSegmentClipPath({
    index: effectiveIndex,
    totalItems: effectiveTotal,
    isFunnel,
  });

  // Compute horizontal padding so text stays within the narrowest edge of the trapezoid.
  const increment = 50 / effectiveTotal;
  const textInsetPercent = isFunnel
    ? 50 - increment * (effectiveTotal - effectiveIndex - 1)
    : 50 - increment * effectiveIndex;
  const insidePadding = `${textInsetPercent + 1}%`;

  if (isInside) {
    return (
      <div className={cn("group/pyramid-item relative h-full w-full")}>
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
            <SlateElement
              ref={contentRef}
              className="relative z-10 w-full py-4 text-center"
              style={{
                paddingLeft: insidePadding,
                paddingRight: insidePadding,
              }}
              {...props}
            >
              {props.children}
            </SlateElement>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group/pyramid-item relative h-full w-full")}>
      <div
        className={cn(
          "grid h-full auto-cols-fr grid-flow-col items-center",
          alignment === "right" && "col-start-2",
        )}
      >
        <div className="relative flex-1">
          <div
            data-decor="true"
            className="grid place-items-center border-b border-(--presentation-card-background) text-2xl font-bold"
            style={{
              height: `${shapeHeight}px`,
              clipPath,
              backgroundColor: markerColor,
              color: "var(--presentation-background)",
            }}
          >
            {icon ? <PresentationIcon icon={icon} size={24} /> : index + 1}
          </div>
        </div>
        <div
          className={cn(
            "relative flex h-full flex-1 items-center after:absolute after:bottom-0 after:h-px after:bg-(--presentation-card-background) after:content-['']",
            alignment === "right"
              ? "after:left-0 after:-right-(--border-extension)"
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
          <SlateElement
            ref={contentRef}
            className="grid w-max items-center px-3"
            {...props}
          >
            {props.children}
          </SlateElement>
        </div>
      </div>
    </div>
  );
}
