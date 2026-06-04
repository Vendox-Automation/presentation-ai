"use client";

import { cva } from "class-variance-authority";
import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import {
  type TBoxGroupElement,
  type TBoxItemElement,
} from "../plugins/box-plugin";
import { getAlignmentClasses, getDefaultColumnSize } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { PresentationIcon } from "./presentation-icon";

export const boxItemVariants = cva(
  "w-full border p-4 transition-(--presentation-transition)",
  {
    variants: {
      boxType: {
        outline: "border-2 bg-transparent",
        icon: "gap-3 border-0 bg-(--presentation-card-background)",
        solid: "border-0 bg-(--presentation-card-background)",
        sideline: "border-y-2 border-r-2 border-l-8 bg-transparent",
        "side-label": "border-y-0 border-r-0 border-l-8 bg-transparent",
        "top-label": "border-x-0 border-t-8 border-b-0 bg-transparent",
        "top-circle": "relative mt-6 border-2 bg-transparent pt-10",
        joined: "rounded-none!",
        "joined-icon": "relative rounded-none!",
        leaf: "rounded-none rounded-tl-lg! rounded-br-lg!",
        labeled:
          "overflow-hidden border-2 bg-transparent pt-14 @[600px]/box-item:pt-4 @[600px]/box-item:pl-14",
        alternating: "border-0 bg-(--presentation-card-background)",
      },
    },
  },
);

const ICON_BOX_TYPES = new Set(["icon", "top-circle", "joined-icon"]);
const PRIMARY_ACCENT_BOX_TYPES = new Set([
  "outline",
  "sideline",
  "side-label",
  "top-label",
  "top-circle",
  "joined",
  "joined-icon",
  "leaf",
  "labeled",
]);

function getItemIndex(path: PlateElementProps<TBoxItemElement>["path"]) {
  return path[path.length - 1] ?? 0;
}

export const BoxItem = (props: PlateElementProps<TBoxItemElement>) => {
  const isPresenting = usePresentationState((state) => state.isPresenting);

  // Get parent element for color and variant information
  const parentPath = PathApi.parent(props.path);
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TBoxGroupElement;

  const boxType = parentElement?.boxType ?? "solid";
  const columnSize =
    parentElement?.columnSize ??
    getDefaultColumnSize(parentElement?.children.length ?? 0);
  const { icon } = props.element as unknown as { icon?: string };
  const itemIndex = getItemIndex(props.path);
  const isLastItem = parentElement?.children
    ? itemIndex === parentElement.children.length - 1
    : false;

  const isEndOfRow =
    (columnSize === "md" && (itemIndex + 1) % 3 === 0) ||
    (columnSize === "lg" && (itemIndex + 1) % 2 === 0);
  const isStartOfRow =
    itemIndex > 0 &&
    ((columnSize === "md" && itemIndex % 3 === 0) ||
      (columnSize === "lg" && itemIndex % 2 === 0));
  const accentColor = getPresentationAccentColor(
    props.element,
    parentElement,
    "var(--presentation-primary)",
  );
  const shouldUseAccent = PRIMARY_ACCENT_BOX_TYPES.has(boxType);

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = parentElement?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        "group @container/box-item",
        isPresenting ? "w-full self-stretch" : "size-full",
      )}
    >
      <div
        className={cn(
          boxItemVariants({ boxType }),
          isPresenting ? "grid size-full" : "grid size-full",
          ICON_BOX_TYPES.has(boxType)
            ? "grid-flow-row gap-2"
            : "auto-cols-fr grid-flow-col gap-4",
          boxType === "joined-icon" && "overflow-visible",
          boxType === "joined-icon" &&
            !isLastItem &&
            !isEndOfRow &&
            "pr-10! @[600px]/box-item:pr-4!",
          boxType === "joined-icon" &&
            !isLastItem &&
            "@[600px]/box-item:pb-10!",
          boxType === "joined-icon" &&
            itemIndex > 0 &&
            !isStartOfRow &&
            "pl-10! @[600px]/box-item:pl-4!",
          boxType === "joined-icon" &&
            itemIndex > 0 &&
            "@[600px]/box-item:pt-10!",
          boxType === "labeled" && "relative",
          boxType === "alternating" && "text-center",
          "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
          "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[background:none!important;]",
          "[&_:is(.presentation-heading)]:text-(--presentation-text)!",
        )}
        data-bg-export="true"
        style={{
          borderColor: accentColor,
          color: shouldUseAccent ? accentColor : undefined,
          borderRadius:
            boxType !== "joined" &&
            boxType !== "joined-icon" &&
            boxType !== "leaf" &&
            boxType !== "side-label" &&
            boxType !== "top-label"
              ? "var(--presentation-card-border-radius, 0.5rem)"
              : undefined,
          boxShadow:
            boxType === "solid"
              ? "var(--presentation-card-shadow, 0 1px 3px rgba(0,0,0,0.12))"
              : undefined,
        }}
      >
        {boxType === "labeled" ? (
          <div
            className="absolute top-0 right-0 left-0 flex h-12 items-center justify-center @[600px]/box-item:right-auto @[600px]/box-item:bottom-0 @[600px]/box-item:h-auto @[600px]/box-item:w-12 @[600px]/box-item:flex-col"
            style={{ backgroundColor: accentColor }}
          >
            {isPresenting ? (
              <div className="relative z-10 flex size-10 items-center justify-center text-lg font-bold text-white">
                {icon ? (
                  <PresentationIcon icon={icon} size={20} />
                ) : (
                  <span>{itemIndex + 1}</span>
                )}
              </div>
            ) : (
              <IconPicker
                defaultIcon={icon}
                hidePlaceholderWhenEmpty={false}
                placeholder={
                  <span className="text-lg font-bold text-white">
                    {itemIndex + 1}
                  </span>
                }
                onIconSelect={(iconName) => handleIconSelect(iconName)}
                onIconRemove={() => {
                  const itemPath = props.editor.api.findPath(props.element);
                  if (!itemPath) return;
                  props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
                }}
                className="relative z-10 size-10 border-transparent bg-transparent shadow-none hover:bg-white/15 focus-visible:ring-0 focus-visible:ring-offset-0"
                size="md"
                style={{
                  borderColor: "transparent",
                  backgroundColor: "transparent",
                  color: "white",
                }}
              />
            )}
          </div>
        ) : null}
        {boxType === "joined-icon" && !isLastItem ? (
          <IconPicker
            disabled={false}
            defaultIcon={icon}
            hidePlaceholderWhenEmpty
            onIconSelect={(name) => handleIconSelect(name)}
            onIconRemove={() => {
              const itemPath = props.editor.api.findPath(props.element);
              if (!itemPath) return;
              props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
            }}
            className={cn(
              "absolute top-1/2 right-0 z-10 size-10 translate-x-1/2 -translate-y-1/2 rounded-md border-2 bg-(--presentation-background) shadow-none hover:opacity-80 disabled:opacity-100 @[600px]/box-item:top-auto @[600px]/box-item:right-1/2 @[600px]/box-item:bottom-0 @[600px]/box-item:translate-x-1/2 @[600px]/box-item:translate-y-1/2",
              isEndOfRow && "hidden @[600px]/box-item:flex",
            )}
            size="sm"
            style={{ borderColor: accentColor }}
          />
        ) : null}
        {ICON_BOX_TYPES.has(boxType) && boxType !== "joined-icon" ? (
          <div
            className={cn(
              boxType === "top-circle" &&
                "absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
            )}
          >
            <IconPicker
              disabled={false}
              defaultIcon={icon}
              hidePlaceholderWhenEmpty={boxType !== "top-circle"}
              onIconSelect={(name) => handleIconSelect(name)}
              onIconRemove={() => {
                const itemPath = props.editor.api.findPath(props.element);
                if (!itemPath) return;
                props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
              }}
              className={cn(
                "shadow-none disabled:opacity-100",
                boxType === "top-circle"
                  ? "flex items-center justify-center rounded-full border-2 transition-all duration-200 hover:scale-110 active:scale-95"
                  : "hover:opacity-80",
              )}
              placeholder={
                boxType === "top-circle" ? (
                  <span className="size-4" />
                ) : undefined
              }
              size={boxType === "top-circle" ? "lg" : "md"}
              style={
                boxType === "top-circle"
                  ? {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                      color: "var(--presentation-background)",
                      width: "2.75rem",
                      height: "2.75rem",
                    }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                    }
              }
            />
          </div>
        ) : null}
        <div className={cn("w-full", getAlignmentClasses(alignment))}>
          {props.children}
        </div>
      </div>
    </PlateElement>
  );
};
