import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  type TTimelineGroupElement,
  type TTimelineItemElement,
} from "../../plugins/timeline-plugin";
import { getAlignmentClasses } from "../../utils";
import { PresentationIcon } from "../presentation-icon";
import {
  circleVariants,
  connectorLineVariants,
  containerVariants,
  contentVariants,
} from "../timeline-item";

const HORIZONTAL_DOUBLE_CONTENT_CLASS =
  "w-[min(22rem,calc(200%-2.5rem))] max-w-none px-3 text-center [&_h3]:mb-2 [&_h3]:text-base [&_p]:text-xs [&_p]:leading-snug";
const VERTICAL_DOUBLE_CONTENT_CLASS =
  "relative z-10 min-h-40 max-w-full py-5 [&_h3]:mb-2 [&_h3]:text-base [&_p]:text-xs [&_p]:leading-snug";

export function TimelineItemStatic(props: SlateElementProps) {
  const element = props.element as TTimelineItemElement;
  const parentPath = PathApi.parent(
    props.editor.api.findPath(props.element) ?? [-1],
  );
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TTimelineGroupElement;
  const orientation = parentElement.orientation ?? "vertical";
  const sidedness = parentElement.sidedness ?? "single";
  const showLine = parentElement.showLine ?? true;
  const numbered = parentElement.numbered ?? true;
  const variant = parentElement.variant ?? "default";
  const index =
    (props.editor.api.findPath(props.element)?.at(-1) as number) ?? 0;
  const totalItems = parentElement.children.length;
  const itemNumber = index + 1;
  const isEven =
    orientation === "horizontal" && sidedness === "double"
      ? index % 2 === 0
      : itemNumber % 2 === 0;
  const isFirstItem = index === 0;
  const isLastItem = index === totalItems - 1;

  const alignment = parentElement.alignment ?? "left";
  const horizontalDoubleEdgeAlignmentClass =
    sidedness === "double" && orientation === "horizontal"
      ? isFirstItem
        ? "justify-self-start"
        : isLastItem
          ? "justify-self-end"
          : "justify-self-center"
      : "";
  const horizontalDoubleTextAlignmentClass =
    sidedness === "double" && orientation === "horizontal"
      ? isFirstItem
        ? "items-start text-left [&>*]:self-start [&>*]:text-left"
        : isLastItem
          ? "items-end text-right [&>*]:self-end [&>*]:text-right"
          : "items-center text-center [&>*]:self-center [&>*]:text-center"
      : "";
  const verticalDoubleOverlapClass =
    sidedness === "double" && orientation === "vertical"
      ? isFirstItem
        ? "-mb-10 pb-10"
        : isLastItem
          ? "-mt-10 pt-10"
          : "-my-10 py-10"
      : "";
  const verticalDoubleTextAlignmentClass =
    sidedness === "double" && orientation === "vertical"
      ? isEven
        ? "items-start text-left [&>*]:self-start [&>*]:text-left"
        : "items-end text-right [&>*]:self-end [&>*]:text-right"
      : "";
  const timelineColor =
    (parentElement.color as string) || "var(--presentation-smart-layout)";
  const timelineTextColor = "var(--presentation-background)";
  const { icon } = element;
  return (
    //* Container
    <div
      className={cn(
        containerVariants({
          orientation,
          sidedness,
          isEven,
          showLine,
          alignment,
        }),
        sidedness === "single" &&
          alignment === "left" &&
          orientation === "horizontal" &&
          "flex-col",
        sidedness === "single" &&
          alignment === "right" &&
          orientation === "horizontal" &&
          "flex-col-reverse",
        sidedness === "single" &&
          alignment === "left" &&
          orientation === "vertical" &&
          "flex-row",
        sidedness === "single" &&
          alignment === "right" &&
          orientation === "vertical" &&
          "flex-row-reverse",
      )}
    >
      {/* Circle */}
      <div
        data-shape="ellipse"
        data-shape-role="timeline-marker"
        data-fill-color={timelineColor}
        data-text-color={timelineTextColor}
        data-shape-text={numbered ? String(itemNumber) : undefined}
        className={cn(
          circleVariants({ orientation, sidedness }),
          sidedness === "single" && alignment === "right" && "rotate-180",
          sidedness === "single" &&
            alignment === "right" &&
            orientation === "horizontal" &&
            "translate-y-3",
          sidedness === "double" &&
            orientation === "horizontal" &&
            "row-start-2",
        )}
        style={
          {
            backgroundColor: timelineColor,
            color: timelineTextColor,
            "--ring-color": timelineColor,
            "--before-bg": timelineColor,
          } as React.CSSProperties & {
            "--ring-color": string;
            "--before-bg": string;
          }
        }
      >
        {showLine ? (
          <div
            aria-hidden="true"
            data-shape="rect"
            data-shape-role="timeline-connector"
            data-fill-color={timelineColor}
            data-orientation={orientation}
            className={cn(
              connectorLineVariants({ orientation, sidedness, isEven }),
            )}
          />
        ) : null}
        <div
          className={cn(
            "relative z-10",
            sidedness === "single" && alignment === "right" && "rotate-180",
          )}
        >
          {icon ? (
            <PresentationIcon icon={icon} size={18} />
          ) : numbered ? (
            itemNumber
          ) : (
            ""
          )}
        </div>
      </div>
      {/* Content */}
      <SlateElement
        className={cn(
          "max-w-full",
          contentVariants({ orientation, sidedness }),
          getAlignmentClasses(alignment),
          sidedness === "double" &&
            orientation === "horizontal" &&
            isEven &&
            cn(
              "row-start-1 justify-end pb-8",
              horizontalDoubleEdgeAlignmentClass,
              horizontalDoubleTextAlignmentClass,
              HORIZONTAL_DOUBLE_CONTENT_CLASS,
            ),
          sidedness === "double" &&
            orientation === "horizontal" &&
            !isEven &&
            cn(
              "row-start-3 justify-start pt-8",
              horizontalDoubleEdgeAlignmentClass,
              horizontalDoubleTextAlignmentClass,
              HORIZONTAL_DOUBLE_CONTENT_CLASS,
            ),
          sidedness === "double" &&
            orientation === "vertical" &&
            cn(
              VERTICAL_DOUBLE_CONTENT_CLASS,
              verticalDoubleOverlapClass,
              verticalDoubleTextAlignmentClass,
            ),
          variant === "boxes" &&
            "flex-1 w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm",
        )}
        {...props}
      >
        {props.children}
      </SlateElement>
    </div>
  );
}
