import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import { useRef } from "react";

import { cn } from "@/lib/utils";
import {
  type TArrowListElement,
  type TArrowListItemElement,
} from "../../plugins/arrow-plugin";
import { getAlignmentClasses } from "../../utils";
import { ArrowChevron } from "../arrow-item";

export function ArrowItemStatic(
  props: SlateElementProps<TArrowListItemElement>,
) {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath);
  const { orientation, svgType, showIcon } = parentElement as TArrowListElement;
  const isHorizontal = orientation === "horizontal";
  const { icon } = props.element as unknown as { icon?: string };

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = (parentElement as TArrowListElement)?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";

  const contentRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      className={cn(
        "group/arrow-item relative mb-2 flex w-full max-w-full min-w-0 gap-6 pl-4",
        isHorizontal && "flex-col gap-3 pl-0",
        !isHorizontal && "items-start",
        alignment === "right" && !isHorizontal && "pr-4 pl-0 flex-row-reverse",
        alignment === "center" && "justify-center",
      )}
    >
      {/* Chevron icon column */}
      <div
        className={cn(
          "relative grid shrink-0",
          isHorizontal ? "h-24 w-full" : "h-full w-24",
        )}
      >
        <ArrowChevron
          className={cn(
            "relative z-50 block overflow-visible",
            isHorizontal ? "top-0 left-0" : "top-0",
          )}
          isHorizontal={isHorizontal}
          sizeTargetRef={contentRef}
          svgType={svgType}
          color={
            (parentElement?.color as string) ||
            "var(--presentation-smart-layout, var(--presentation-primary))"
          }
          icon={icon}
          showIcon={!!showIcon}
          disabled={true}
        />
      </div>

      {/* Content column */}
      <div
        ref={contentRef}
        className={cn("grid min-w-0 flex-1", !isHorizontal && "self-start")}
      >
        <SlateElement
          {...props}
          className={cn("min-w-0 w-full", getAlignmentClasses(alignment))}
        >
          {props.children}
        </SlateElement>
      </div>
    </div>
  );
}
