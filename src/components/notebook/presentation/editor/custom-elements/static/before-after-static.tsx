import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { getDefaultColumnSize } from "../../utils";

function getStaticComparisonGridColumns(columnSize: "sm" | "md" | "lg" | "xl") {
  if (columnSize === "sm") return "grid-cols-4";
  if (columnSize === "md") return "grid-cols-3";
  if (columnSize === "lg") return "grid-cols-2";
  return "grid-cols-1";
}

export default function BeforeAfterGroupStatic(props: SlateElementProps) {
  const { alignment = "center" } = props.element as {
    alignment?: "left" | "center" | "right";
    columnSize?: "sm" | "md" | "lg" | "xl";
  };
  const columnSize =
    (props.element.columnSize as "sm" | "md" | "lg" | "xl" | undefined) ??
    getDefaultColumnSize(props.element.children?.length ?? 0);

  return (
    <SlateElement {...props} className="mb-4">
      <div
        className={cn(
          "relative grid max-w-full auto-rows-fr items-stretch gap-6 *:min-w-0",
          getStaticComparisonGridColumns(columnSize),
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
