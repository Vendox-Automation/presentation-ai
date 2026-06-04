"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";

export function PresentationParagraphElement({
  className,
  children,
  ref,
  ...props
}: PlateElementProps) {
  return (
    <PlateElement
      ref={ref}
      className={cn(
        "slate-selectable m-0 px-0 py-1 [font-size:var(--presentation-p-size)]",
        "leading-[1.6]",
        "text-(--presentation-text)",
        "[font-family:var(--presentation-body-font)]",
        "caret-primary",
        className,
      )}
      {...props}
    >
      {children}
    </PlateElement>
  );
}

PresentationParagraphElement.displayName = "PresentationParagraphElement";
