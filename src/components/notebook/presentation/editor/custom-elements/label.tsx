"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { type TLabelElement } from "../lib";

function getJustifyClass(alignment: TLabelElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export default function LabelElement({
  attributes,
  ...props
}: PlateElementProps<TLabelElement>) {
  const alignment = props.element.alignment ?? "left";
  const backgroundColor =
    props.element.backgroundColor ?? "var(--presentation-primary)";
  const textColor =
    props.element.textColor ??
    props.element.color ??
    "var(--presentation-background)";
  const style = {
    "--presentation-label-accent": backgroundColor,
    "--presentation-label-background": backgroundColor,
    "--presentation-label-color": textColor,
  } as React.CSSProperties;

  return (
    <PlateElement
      {...props}
      className={cn(
        "slate-selectable relative my-1 flex w-full",
        getJustifyClass(alignment),
      )}
      style={style}
      attributes={{
        ...attributes,
        "data-plate-open-context-menu": true,
      }}
    >
      <div className="inline-flex max-w-full rounded-full border border-(--presentation-label-accent)/45 bg-(--presentation-label-background) px-3 py-1 text-xs font-bold tracking-normal text-(--presentation-label-color) uppercase">
        {props.children}
      </div>
    </PlateElement>
  );
}
