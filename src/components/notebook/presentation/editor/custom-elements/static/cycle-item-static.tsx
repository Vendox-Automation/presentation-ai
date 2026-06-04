import { SlateElement, type SlateElementProps } from "platejs/static";
import React from "react";

import { cn } from "@/lib/utils";
import { CycleContext } from "../cycle-element";

const RIGHT_COLUMN_ALIGNMENT =
  "text-left [&_h1]:!text-left [&_h2]:!text-left [&_h3]:!text-left [&_h4]:!text-left [&_h5]:!text-left [&_h6]:!text-left [&_p]:!text-left [&_li]:!text-left";

const LEFT_COLUMN_ALIGNMENT =
  "text-right [&_h1]:!text-right [&_h2]:!text-right [&_h3]:!text-right [&_h4]:!text-right [&_h5]:!text-right [&_h6]:!text-right [&_p]:!text-right [&_li]:!text-right";

export function CycleItemStatic(props: SlateElementProps) {
  const { isMultiColumn, side } = React.use(CycleContext);

  return (
    <div className="group/cycle-item relative min-w-0">
      <div
        className={cn(
          "w-full rounded-md bg-(--presentation-card-background) px-3 py-2",
          !isMultiColumn && "text-left",
          isMultiColumn && side === "left" && LEFT_COLUMN_ALIGNMENT,
          isMultiColumn && side === "right" && RIGHT_COLUMN_ALIGNMENT,
        )}
        data-bg-export="true"
      >
        <SlateElement className="min-w-0 flex-1" {...props}>
          {props.children}
        </SlateElement>
      </div>
    </div>
  );
}
