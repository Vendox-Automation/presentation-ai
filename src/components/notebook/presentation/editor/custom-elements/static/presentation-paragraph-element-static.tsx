import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";

export function PresentationParagraphElementStatic(props: SlateElementProps) {
  const elementTag = props.element.listStyleType ? "div" : "p";

  return (
    <SlateElement
      as={elementTag}
      {...props}
      className={cn(
        "m-0 px-0 py-1 [font-size:var(--presentation-p-size)]",
        "leading-[1.6]",
        "text-(--presentation-text)",
        "[font-family:var(--presentation-body-font)]",
        "caret-primary",
        props.className,
      )}
    >
      {props.children}
    </SlateElement>
  );
}
