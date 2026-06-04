import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  getDefaultColumnSize,
  getIconListOrientation,
  iconListColumnSizeVariant,
} from "../../utils";

export function IconListStatic(props: SlateElementProps) {
  const element = props.element as {
    columnSize?: "sm" | "md" | "lg" | "xl";
    alignment?: "left" | "center" | "right";
    children?: unknown[];
    orientation?: unknown;
  };
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children?.length ?? 0);
  const orientation = getIconListOrientation(
    element.orientation,
    element.children?.length ?? 0,
  );

  return (
    <SlateElement {...props} className={cn("my-6", props.className)}>
      <div className="@container/icon-list max-w-full">
        <div
          data-icon-list-grid="true"
          className={cn(
            iconListColumnSizeVariant({ columnSize }),
            "gap-6",
            orientation === "top" && "items-start",
          )}
        >
          {props.children}
        </div>
      </div>
    </SlateElement>
  );
}
