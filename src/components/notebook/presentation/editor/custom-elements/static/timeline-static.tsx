import { SlateElement, type SlateElementProps } from "platejs/static";
import { type CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { type TTimelineGroupElement } from "../../plugins/timeline-plugin";
import { containerVariants, lineVariants } from "../timeline";

export default function TimelineStatic(
  props: SlateElementProps<TTimelineGroupElement>,
) {
  const orientation = props.element?.orientation ?? "vertical";
  const sidedness = props.element?.sidedness ?? "single";
  const alignment = props.element?.alignment ?? "left";
  const showLine = props.element?.showLine ?? true;
  const itemCount = Math.max(props.element.children.length, 1);
  const timelineColor =
    (props.element.color as string) || "var(--presentation-smart-layout)";
  const lineStyle = {
    backgroundColor: timelineColor,
    "--timeline-line-inset": `calc(50% / ${itemCount})`,
  } satisfies CSSProperties & { "--timeline-line-inset": string };

  return (
    <SlateElement {...props} className="relative">
      {showLine ? (
        <div
          data-shape="rect"
          data-shape-role="timeline-rail"
          data-fill-color={timelineColor}
          data-orientation={orientation}
          className={cn(lineVariants({ orientation, sidedness, alignment }))}
          style={lineStyle}
        />
      ) : null}

      <div
        className={cn(
          containerVariants({ orientation, sidedness }),
          sidedness === "single" && orientation === "horizontal" && "*:flex-1",
          orientation === "horizontal" && sidedness === "double" && "*:flex-1",
        )}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
