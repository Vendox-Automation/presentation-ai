import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { type TStepsGroupElement } from "../../plugins/steps-plugin";
import { getDefaultColumnSize } from "../../utils";

const columnSizeToColumns: Record<string, number> = {
  sm: 4,
  md: 3,
  lg: 2,
  xl: 1,
};

export default function StepsElementStatic(props: SlateElementProps) {
  const element = props.element as TStepsGroupElement;
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children.length);

  const columns = columnSizeToColumns[columnSize] ?? 3;

  const isVertical = columns === 1;
  const horizontalAlignment = "items-stretch";

  return (
    <SlateElement {...props} className="my-4">
      <div
        className={cn(
          "grid w-full",
          isVertical ? "grid-flow-row gap-4" : `${horizontalAlignment} gap-6`,
        )}
        style={
          isVertical
            ? { gridTemplateColumns: "1fr" }
            : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
        }
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
