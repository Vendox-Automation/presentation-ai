import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { getDefaultColumnSize, type PresentationColumnSize } from "../../utils";

function getStaticComparisonGridColumns(
  columnSize: PresentationColumnSize,
  itemCount: number,
) {
  const columnSizeToColumns = {
    sm: 4,
    md: 3,
    lg: 2,
    xl: 1,
  } satisfies Record<PresentationColumnSize, number>;
  const columns = Math.max(
    1,
    Math.min(itemCount, columnSizeToColumns[columnSize]),
  );

  if (columns === 4) return "grid-cols-4";
  if (columns === 3) return "grid-cols-3";
  if (columns === 2) return "grid-cols-2";
  return "grid-cols-1";
}

export default function CompareGroupStatic(props: SlateElementProps) {
  const { alignment = "center" } = props.element as {
    alignment?: "left" | "center" | "right";
    columnSize?: PresentationColumnSize;
  };
  const childCount = props.element.children?.length ?? 0;
  const columnSize =
    (props.element.columnSize as PresentationColumnSize | undefined) ??
    getDefaultColumnSize(childCount);

  return (
    <SlateElement {...props} className="mb-4">
      <div
        className={cn(
          "relative grid max-w-full auto-rows-fr items-stretch gap-6 *:min-w-0",
          getStaticComparisonGridColumns(columnSize, childCount),
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
