import { ArrowDown, ArrowRight } from "lucide-react";
import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { type TBeforeAfterGroupElement } from "../../plugins/before-after-plugin";
import { getAlignmentClasses, getDefaultColumnSize } from "../../utils";

export function BeforeAfterSideStatic(props: SlateElementProps) {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath);

  const { alignment = "center" } = parentElement as {
    alignment?: "left" | "center" | "right";
    color?: string;
    columnSize?: "sm" | "md" | "lg" | "xl";
    children?: unknown[];
  };
  const index = path.at(-1) ?? 0;
  const childCount =
    (parentElement as { children?: unknown[] })?.children?.length ?? 0;
  const columnSize =
    (parentElement as TBeforeAfterGroupElement | undefined)?.columnSize ??
    getDefaultColumnSize(childCount);
  const columns = getColumnCount(columnSize);
  const isVertical = columnSize === "xl";
  const showSeparator = shouldShowSeparator({
    columns,
    index,
    itemCount: childCount,
  });
  const shouldSpanFullRow =
    columns === 2 && childCount % columns === 1 && index === childCount - 1;
  const accentColor =
    (parentElement?.color as string) || "var(--presentation-primary)";

  return (
    <div
      className={cn(
        "relative flex h-full min-w-0 flex-1 items-stretch",
        isVertical && "flex-col items-center gap-4",
      )}
      style={shouldSpanFullRow ? { gridColumn: "1 / -1" } : undefined}
    >
      <div
        data-bg-export="true"
        className={cn(
          "grid h-full w-full rounded-xl border bg-card p-6 shadow-md",
          "border-t-4",
        )}
        style={{
          backgroundColor: "var(--presentation-background)",
          color: "var(--presentation-text)",
          borderColor: "hsl(var(--border))",
          borderTopColor:
            (parentElement?.color as string) || "var(--presentation-primary)",
        }}
      >
        <SlateElement
          {...props}
          className={cn("h-full", getAlignmentClasses(alignment))}
        >
          {props.children}
        </SlateElement>
      </div>
      {showSeparator ? (
        <BeforeAfterSeparator
          accentColor={accentColor}
          isVertical={isVertical}
        />
      ) : null}
    </div>
  );
}

function BeforeAfterSeparator({
  accentColor,
  isVertical,
}: {
  accentColor: string;
  isVertical: boolean;
}) {
  const ArrowIcon = isVertical ? ArrowDown : ArrowRight;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center self-center",
        !isVertical && "absolute -right-9 top-1/2 z-10 -translate-y-1/2",
      )}
      aria-hidden
    >
      <div
        data-shape="ellipse"
        data-shape-text={isVertical ? "↓" : "→"}
        data-fill-color={accentColor}
        data-text-color="var(--presentation-background)"
        className="grid size-12 place-items-center rounded-full text-sm font-bold shadow-xs"
        style={{
          backgroundColor: accentColor,
          color: "var(--presentation-background)",
          pointerEvents: "none",
        }}
      >
        <ArrowIcon className="size-5" strokeWidth={2.5} />
      </div>
    </div>
  );
}

function getColumnCount(columnSize: TBeforeAfterGroupElement["columnSize"]) {
  const columnSizeToColumns = {
    lg: 2,
    md: 3,
    sm: 4,
    xl: 1,
  } satisfies Record<
    NonNullable<TBeforeAfterGroupElement["columnSize"]>,
    number
  >;

  return columnSize ? columnSizeToColumns[columnSize] : columnSizeToColumns.md;
}

function shouldShowSeparator({
  columns,
  index,
  itemCount,
}: {
  columns: number;
  index: number;
  itemCount: number;
}) {
  const isLastItem = index === itemCount - 1;
  const isRowEnd = (index + 1) % columns === 0;

  return !isLastItem && (columns === 1 || !isRowEnd);
}
