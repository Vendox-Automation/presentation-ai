import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  type TBoxGroupElement,
  type TBoxItemElement,
} from "../../plugins/box-plugin";
import { getAlignmentClasses, getDefaultColumnSize } from "../../utils";
import { boxItemVariants } from "../box-item";
import { PresentationIcon } from "../presentation-icon";

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

export function BoxItemStatic(props: SlateElementProps<TBoxItemElement>) {
  const { editor, element } = props;
  const path = editor.api.findPath(element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(editor, parentPath) as TBoxGroupElement;

  const boxType = parentElement?.boxType ?? "solid";
  const columnSize =
    parentElement?.columnSize ??
    getDefaultColumnSize(parentElement?.children.length ?? 0);
  const { icon } = element as unknown as { icon?: string };
  const itemIndex = path[path.length - 1] ?? 0;
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
  const accentColor =
    (element.color as string | undefined) ??
    (parentElement?.color as string | undefined) ??
    "var(--presentation-primary)";
  const shouldUseAccent = PRIMARY_ACCENT_BOX_TYPES.has(boxType);

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = element.alignment;
  const parentAlignment = parentElement?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";

  return (
    <SlateElement {...props} className="@container/box-item self-stretch">
      <div
        className={cn(
          boxItemVariants({
            boxType,
          }),
          "grid size-full flex-1",
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
            <div className="relative z-10 flex size-10 items-center justify-center text-lg font-bold text-white">
              {icon ? (
                <PresentationIcon icon={icon} size={20} />
              ) : (
                <span>{itemIndex + 1}</span>
              )}
            </div>
          </div>
        ) : null}
        {boxType === "joined-icon" && !isLastItem ? (
          <div
            className={cn(
              "absolute top-1/2 right-0 z-10 flex size-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-md border-2 bg-(--presentation-background) @[600px]/box-item:top-auto @[600px]/box-item:right-1/2 @[600px]/box-item:bottom-0 @[600px]/box-item:translate-x-1/2 @[600px]/box-item:translate-y-1/2",
              isEndOfRow && "hidden @[600px]/box-item:flex",
            )}
            style={{ borderColor: accentColor }}
          >
            {icon ? <PresentationIcon icon={icon} size={18} /> : null}
          </div>
        ) : null}
        {ICON_BOX_TYPES.has(boxType) &&
        boxType !== "joined-icon" &&
        (icon || boxType === "top-circle") ? (
          <div
            className={cn(
              "z-10 flex items-center justify-center",
              boxType === "top-circle"
                ? "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                : "size-8 shadow-none",
            )}
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
          >
            {icon ? <PresentationIcon icon={icon} size={20} /> : null}
          </div>
        ) : null}
        <div className={cn("w-full", getAlignmentClasses(alignment))}>
          {props.children}
        </div>
      </div>
    </SlateElement>
  );
}
