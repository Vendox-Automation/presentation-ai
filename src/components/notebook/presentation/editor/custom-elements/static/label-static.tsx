import { SlateElement, type SlateElementProps } from "platejs/static";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { type TLabelElement } from "../../lib";

function getJustifyClass(alignment: TLabelElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export function LabelStatic(props: SlateElementProps<TLabelElement>) {
  const alignment = props.element.alignment ?? "left";
  const textColor =
    props.element.textColor ??
    props.element.color ??
    "var(--presentation-background)";
  const backgroundColor =
    props.element.backgroundColor ?? "var(--presentation-primary)";
  const style = {
    "--presentation-label-background": backgroundColor,
    "--presentation-label-color": textColor,
  } as React.CSSProperties;

  return (
    <SlateElement
      {...props}
      className={cn("relative my-1 flex w-full", getJustifyClass(alignment))}
      style={style}
    >
      <div className="inline-flex max-w-full rounded-full border border-(--presentation-label-color)/35 bg-(--presentation-label-background) px-3 py-1 text-xs font-bold tracking-normal text-(--presentation-label-color) uppercase">
        {props.children}
      </div>
    </SlateElement>
  );
}
