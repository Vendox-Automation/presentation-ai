import { type Path } from "platejs";
import {
  ElementStatic,
  SlateElement,
  type SlateElementProps,
} from "platejs/static";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { type TCycleItemElement } from "../../plugins/cycle-plugin";
import { CycleWheel } from "../cycle-element";
import {
  CYCLE_WHEEL_SIZE_PX,
  CycleContext,
  useCycleFitScale,
  type CycleColumnSide,
} from "../cycle-element";

function StaticCycleColumn({
  children,
  isMultiColumn,
  side,
}: {
  children: ReactNode[];
  isMultiColumn: boolean;
  side: CycleColumnSide;
}) {
  const contextValue = { isMultiColumn, side };

  if (children.length === 0) {
    return <div className="min-w-0" aria-hidden="true" />;
  }

  return (
    <CycleContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex min-w-0 flex-col justify-center",
          isMultiColumn ? "h-full gap-4" : "gap-1",
        )}
      >
        {children}
      </div>
    </CycleContext.Provider>
  );
}

const EMPTY_DECORATE = () => [];

type StaticCycleItemEntry = {
  item: TCycleItemElement;
  path: Path;
};

function renderStaticCycleItems(
  editor: SlateElementProps["editor"],
  entries: StaticCycleItemEntry[],
) {
  return entries.map(({ item, path }, index) => {
    const key =
      typeof item.id === "string" || typeof item.id === "number"
        ? item.id
        : `cycle-item-${path.at(-1) ?? index}`;

    return (
      <div key={key} className="min-w-0">
        <ElementStatic
          decorate={EMPTY_DECORATE}
          decorations={[]}
          editor={editor}
          element={item}
          path={path}
        />
      </div>
    );
  });
}

export function CycleElementStatic(props: SlateElementProps) {
  const element = props.element as {
    alignment?: "left" | "center" | "right";
    variant?: "cycle" | "flower" | "ring" | "circle";
    children?: unknown[];
  };
  const { alignment = "center", variant = "cycle" } = element;
  const cycleItems = (element.children ?? []) as TCycleItemElement[];
  const cycleItemEntries = cycleItems.map((item, index) => ({
    item,
    path: [...props.path, index],
  }));
  const totalChildren = cycleItems.length;
  const totalSegments = totalChildren > 0 ? totalChildren : 6;
  const { containerRef, layoutRef, frameStyle, fitStyle } =
    useCycleFitScale<HTMLDivElement>();
  const leftChildren = renderStaticCycleItems(
    props.editor,
    cycleItemEntries.filter((_, index) => index % 2 === 0),
  );
  const rightChildren = renderStaticCycleItems(
    props.editor,
    cycleItemEntries.filter((_, index) => index % 2 === 1),
  );

  return (
    <SlateElement {...props} className={cn("relative my-0", props.className)}>
      <div
        className={cn(
          "flex w-full",
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        <div
          ref={containerRef}
          className="@container/cycle-layout mx-auto w-full"
        >
          <div className="mx-auto" style={frameStyle}>
            <div
              ref={layoutRef}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-4"
              style={fitStyle}
            >
              <StaticCycleColumn isMultiColumn side="left">
                {leftChildren}
              </StaticCycleColumn>

              <CycleWheel
                items={cycleItems}
                sizePx={CYCLE_WHEEL_SIZE_PX}
                totalSegments={totalSegments}
                variant={variant}
              />

              <StaticCycleColumn isMultiColumn side="right">
                {rightChildren}
              </StaticCycleColumn>
            </div>
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
