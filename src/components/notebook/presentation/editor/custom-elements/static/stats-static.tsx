import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  columnSizeVariant,
  getAlignmentClasses,
  getDefaultColumnSize,
} from "../../utils";

export default function StatsGroupStatic(props: SlateElementProps) {
  const element = props.element as {
    columnSize?: "sm" | "md" | "lg" | "xl";
    alignment?: "left" | "center" | "right";
    children?: unknown[];
  };
  const alignment = element.alignment ?? "left";
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children?.length ?? 0);

  return (
    <SlateElement {...props} className="mb-4 w-full max-w-full">
      <div
        className={cn(
          "w-full max-w-full min-w-0",
          columnSizeVariant({ columnSize }),
          getAlignmentClasses(alignment),
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
