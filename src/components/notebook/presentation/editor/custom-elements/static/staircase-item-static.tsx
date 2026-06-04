import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  type TStairGroupElement,
  type TStairItemElement,
} from "../../plugins/staircase-plugin";
import { getAlignmentClasses } from "../../utils";
import { PresentationIcon } from "../presentation-icon";

const STAIR_MIN_BLOCK_HEIGHT = 48;

export function StairItemStatic(props: SlateElementProps<TStairItemElement>) {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TStairGroupElement;

  const totalItems = parentElement?.children?.length || 1;
  const index = (path?.at(-1) as number) ?? 0;
  const alignment =
    props.element.alignment ?? parentElement?.alignment ?? "left";
  const { icon } = props.element;
  const markerColor =
    (parentElement?.color as string) || "var(--presentation-smart-layout)";

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

  // Calculate a width ramp similar to non-static design, but driven by totalItems
  const baseWidth = 70;
  const maxWidth = 220;
  const increment = (maxWidth - baseWidth) / (totalItems - 1 || 1);
  const widthPx = baseWidth + index * increment;

  const variant = parentElement?.variant;
  const isInside = variant === "inside";

  // For inside variant, use percentage-based widths
  const baseWidthPercent = 30;
  const maxWidthPercent = 70;
  const incrementPercent =
    (maxWidthPercent - baseWidthPercent) / (totalItems - 1 || 1);
  const widthPercent = baseWidthPercent + index * incrementPercent;

  if (isInside) {
    return (
      <div className={cn("group/stair-item relative w-full")}>
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
            data-fill-color={
              (parentElement?.color as string) ||
              "var(--presentation-smart-layout)"
            }
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
            <SlateElement
              ref={contentRef}
              className="w-full font-normal"
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
    <div className={cn("group/stair-item relative w-full")}>
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
          data-fill-color={
            (parentElement?.color as string) ||
            "var(--presentation-smart-layout)"
          }
          data-text-color="var(--presentation-background)"
          style={{
            width: `${widthPx}px`,
            height: `${blockHeight}px`,
            backgroundColor: markerColor,
            color: "var(--presentation-background)",
          }}
          className="flex shrink-0 items-center justify-center rounded-md text-2xl font-bold"
        >
          {icon ? <PresentationIcon icon={icon} size={24} /> : index + 1}
        </div>

        <SlateElement
          ref={contentRef}
          className={cn(
            "min-w-0 flex flex-1 flex-col justify-center self-center",
            getAlignmentClasses(alignment),
          )}
          {...props}
        >
          {props.children}
        </SlateElement>
      </div>
    </div>
  );
}
