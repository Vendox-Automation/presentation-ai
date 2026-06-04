import { cva, type VariantProps } from "class-variance-authority";
import { SlateElement, type SlateElementProps } from "platejs/static";
import type * as React from "react";

import { cn } from "@/lib/utils";

const headingVariants = cva("relative mb-1", {
  variants: {
    variant: {
      h1: "pb-1 [font-size:var(--presentation-h1-size)] font-bold",
      h2: "pb-px [font-size:var(--presentation-h2-size)] font-semibold tracking-tight",
      h3: "pb-px [font-size:var(--presentation-h3-size)] font-semibold tracking-tight",
      h4: "[font-size:var(--presentation-h4-size)] font-semibold tracking-tight",
      h5: "[font-size:var(--presentation-h5-size)] font-semibold tracking-tight",
      h6: "[font-size:var(--presentation-h6-size)] font-semibold tracking-tight",
    },
  },
});

export function PresentationHeadingElementStatic({
  variant = "h1",
  ...props
}: SlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <SlateElement
      as={variant!}
      className={cn(
        "text-(--presentation-heading)",
        "[font-family:var(--presentation-heading-font)] font-bold",
        "caret-primary",
        headingVariants({ variant }),
      )}
      {...props}
    >
      {props.children}
    </SlateElement>
  );
}

export function H1ElementStatic(props: SlateElementProps) {
  return <PresentationHeadingElementStatic variant="h1" {...props} />;
}

export function H2ElementStatic(
  props: React.ComponentProps<typeof PresentationHeadingElementStatic>,
) {
  return <PresentationHeadingElementStatic variant="h2" {...props} />;
}

export function H3ElementStatic(
  props: React.ComponentProps<typeof PresentationHeadingElementStatic>,
) {
  return <PresentationHeadingElementStatic variant="h3" {...props} />;
}

export function H4ElementStatic(
  props: React.ComponentProps<typeof PresentationHeadingElementStatic>,
) {
  return <PresentationHeadingElementStatic variant="h4" {...props} />;
}

export function H5ElementStatic(
  props: React.ComponentProps<typeof PresentationHeadingElementStatic>,
) {
  return <PresentationHeadingElementStatic variant="h5" {...props} />;
}

export function H6ElementStatic(
  props: React.ComponentProps<typeof PresentationHeadingElementStatic>,
) {
  return <PresentationHeadingElementStatic variant="h6" {...props} />;
}
