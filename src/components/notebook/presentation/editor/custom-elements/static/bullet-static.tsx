import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { columnSizeVariant, getDefaultColumnSize } from "../../utils";

export function BulletsElementStatic(props: SlateElementProps) {
  const element = props.element as {
    columnSize?: "sm" | "md" | "lg" | "xl";
    bulletType?: "numbered" | "basic" | "arrow";
    alignment?: "left" | "center" | "right";
    children?: unknown[];
  };
  const alignment = element.alignment ?? "center";
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children?.length ?? 0);

  return (
    <SlateElement {...props} className={cn("my-0", props.className)}>
      <div
        className={cn(
          "max-w-full",
          columnSizeVariant({ columnSize }),
          "gap-6",
          // Only apply horizontal alignment, don't break the grid layout
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
