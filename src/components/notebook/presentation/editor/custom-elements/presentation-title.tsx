"use client";

import { cva } from "class-variance-authority";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TPresentationTitleElement } from "../lib";

function getTextAlignClass(alignment: TPresentationTitleElement["alignment"]) {
  if (alignment === "left") return "text-left";
  if (alignment === "right") return "text-right";
  return "text-center";
}

const titleVariants = cva(
  "my-2 font-black leading-[0.95] tracking-normal text-(--presentation-heading) caret-primary",
  {
    variants: {
      variant: {
        display: "text-[4.75rem]",
        humongous: "text-[6.5rem]",
        title: "text-[3.5rem]",
      },
    },
  },
);

export default function PresentationTitleElement(
  props: PlateElementProps<TPresentationTitleElement>,
) {
  const variant = props.element.variant ?? "title";
  const alignment = props.element.alignment ?? "left";
  const color =
    props.element.textColor ??
    props.element.color ??
    "var(--presentation-heading)";

  return (
    <PlateElement
      {...props}
      className={cn(
        titleVariants({ variant }),
        getTextAlignClass(alignment),
        "[font-family:var(--presentation-heading-font)]",
      )}
      style={{
        backgroundColor: props.element.backgroundColor,
        color,
      }}
    >
      {props.children}
    </PlateElement>
  );
}
