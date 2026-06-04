"use client";

import { cva } from "class-variance-authority";
import { NodeApi, PathApi } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { type TTimelineGroupElement } from "../plugins/timeline-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { PresentationIcon } from "./presentation-icon";
import { getSiblingIndexContext } from "./sibling-index";

const HORIZONTAL_DOUBLE_CONTENT_CLASS =
  "w-[min(22rem,calc(200%-2.5rem))] max-w-none px-3 text-center [&_h3]:mb-2 [&_h3]:text-base [&_p]:text-xs [&_p]:leading-snug";
const VERTICAL_DOUBLE_CONTENT_CLASS =
  "relative z-10 min-h-40 max-w-full py-5 [&_h3]:mb-2 [&_h3]:text-base [&_p]:text-xs [&_p]:leading-snug";

export const containerVariants = cva("flex flex-1", {
  variants: {
    orientation: {
      horizontal: "items-center p-4 pt-0",
      vertical: "items-center p-4 pl-0",
    },
    sidedness: {
      single: "",
      double: "",
    },
    isEven: {
      true: "",
      false: "",
    },
    showLine: {
      true: "gap-6",
      false: "gap-4",
    },
    alignment: {
      left: "",
      center: "",
      right: "",
    },
  },
  compoundVariants: [
    {
      sidedness: "single",
      alignment: "left",
      orientation: "horizontal",
      class: "p-4 pt-0",
    },
    {
      sidedness: "single",
      alignment: "right",
      orientation: "horizontal",
      class: "p-4 pb-0",
    },
    {
      sidedness: "single",
      alignment: "left",
      orientation: "vertical",
      class: "p-4 pl-0",
    },
    {
      sidedness: "single",
      alignment: "right",
      orientation: "vertical",
      class: "p-4 pr-0",
    },
    {
      orientation: "horizontal",
      sidedness: "single",
      class: "flex-col",
    },

    {
      orientation: "horizontal",
      sidedness: "double",
      isEven: true,
      class:
        "grid grid-rows-[minmax(max-content,1fr)_2.5rem_minmax(max-content,1fr)] place-items-center gap-0 p-0",
    },
    {
      orientation: "horizontal",
      sidedness: "double",
      isEven: false,
      class:
        "grid grid-rows-[minmax(max-content,1fr)_2.5rem_minmax(max-content,1fr)] place-items-center gap-0 p-0",
    },

    {
      orientation: "vertical",
      sidedness: "double",
      isEven: true,
      class: "w-[calc(50%+2.25rem)] place-self-end pl-4",
    },
    {
      orientation: "vertical",
      sidedness: "double",
      isEven: false,
      class: "w-[calc(50%+2.25rem)] flex-row-reverse place-self-start pl-4",
    },
  ],
});

export const circleVariants = cva(
  "relative flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring ring-(--ring-color) ring-offset-2",
  {
    variants: {
      orientation: {
        horizontal: "",
        vertical: "",
      },
      sidedness: {
        single: "",
        double: "",
      },
    },
  },
);

export const connectorLineVariants = cva(
  "pointer-events-none absolute z-50 rounded-full bg-(--before-bg)",
  {
    variants: {
      orientation: {
        horizontal: "",
        vertical: "",
      },
      sidedness: {
        single: "",
        double: "",
      },
      isEven: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        orientation: "horizontal",
        sidedness: "single",
        class:
          "top-1/2 left-1/2 h-1/2 w-0.5 -translate-x-1/2 translate-y-[calc(100%+2px)]",
      },

      {
        orientation: "horizontal",
        sidedness: "double",
        isEven: true,
        class: "bottom-[calc(100%+2px)] left-1/2 h-3 w-0.5 -translate-x-1/2",
      },

      {
        orientation: "horizontal",
        sidedness: "double",
        isEven: false,
        class: "top-[calc(100%+2px)] left-1/2 h-3 w-0.5 -translate-x-1/2",
      },

      {
        orientation: "vertical",
        class:
          "top-1/2 left-1/2 h-0.5 w-1/2 translate-x-[calc(100%+2px)] -translate-y-1/2",
      },

      {
        orientation: "vertical",
        sidedness: "double",
        isEven: false,
        class:
          "top-1/2 left-0 h-0.5 w-1/2 -translate-x-[calc(100%+2px)] -translate-y-1/2",
      },
    ],
  },
);

export const contentVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-col",
      vertical: "flex-col",
    },
    sidedness: {
      single: "",
      double: "",
    },
  },
});

export function TimelineItem(props: PlateElementProps) {
  const { index, parentElement } =
    getSiblingIndexContext<TTimelineGroupElement>(
      props.editor,
      props.element,
      props.path,
    );
  const isPresenting = useReadOnly();
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TTimelineGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;
  const orientation = resolvedParentElement?.orientation ?? "vertical";
  const sidedness = resolvedParentElement?.sidedness ?? "single";
  const showLine = resolvedParentElement?.showLine ?? true;
  const numbered = resolvedParentElement?.numbered ?? true;
  const variant = resolvedParentElement?.variant ?? "default";
  const totalItems = resolvedParentElement?.children.length ?? 1;
  const itemNumber = index + 1;
  const isEven =
    orientation === "horizontal" && sidedness === "double"
      ? index % 2 === 0
      : itemNumber % 2 === 0;
  const isFirstItem = index === 0;
  const isLastItem = index === totalItems - 1;

  const alignment = resolvedParentElement?.alignment ?? "left";
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
  const timelineColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-smart-layout, var(--presentation-primary))",
  );
  const timelineTextColor = "var(--presentation-background)";
  const { icon } = props.element as { icon?: string };

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  return (
    //* Container
    <PlateElement
      {...props}
      className={cn(
        "group min-h-full",
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
            isPresenting &&
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
        {isPresenting ? (
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
        ) : (
          <IconPicker
            defaultIcon={icon}
            hidePlaceholderWhenEmpty={!numbered}
            placeholder={
              numbered ? (
                <span>{itemNumber}</span>
              ) : (
                <span className="text-lg font-semibold leading-none">+</span>
              )
            }
            onIconSelect={(iconName) => handleIconSelect(iconName)}
            onIconRemove={() => {
              const itemPath = props.editor.api.findPath(props.element);
              if (!itemPath) return;
              props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
            }}
            className={cn(
              "relative z-10 h-8 w-8 border-transparent bg-transparent shadow-none hover:bg-white/15",
              sidedness === "single" && alignment === "right" && "rotate-180",
            )}
            size="sm"
            style={{
              borderColor: "transparent",
              backgroundColor: "transparent",
              color: timelineTextColor,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "h-full max-w-full",
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
      >
        {props.children}
      </div>
    </PlateElement>
  );
}
