import { cva } from "class-variance-authority";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { type TPresentationTitleElement } from "../../lib";

function getTextAlignClass(alignment: TPresentationTitleElement["alignment"]) {
  if (alignment === "left") return "text-left";
  if (alignment === "right") return "text-right";
  return "text-center";
}

const titleVariants = cva(
  "my-2 font-black leading-[0.95] tracking-normal text-(--presentation-heading)",
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

export function PresentationTitleStatic(
  props: SlateElementProps<TPresentationTitleElement>,
) {
  const alignment = props.element.alignment ?? "left";
  const color =
    props.element.textColor ??
    props.element.color ??
    "var(--presentation-heading)";

  return (
    <SlateElement
      {...props}
      className={cn(
        titleVariants({ variant: props.element.variant ?? "title" }),
        getTextAlignClass(alignment),
        "[font-family:var(--presentation-heading-font)]",
      )}
      style={{
        backgroundColor: props.element.backgroundColor,
        color,
      }}
    >
      {props.children}
    </SlateElement>
  );
}
