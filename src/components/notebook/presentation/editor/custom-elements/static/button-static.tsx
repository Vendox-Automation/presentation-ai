import { type TElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { type BUTTON_ELEMENT } from "../../lib";

type ButtonStaticElement = TElement & {
  alignment?: "center" | "left" | "right";
  backgroundColor?: string;
  color?: string;
  textColor?: string;
  type: typeof BUTTON_ELEMENT;
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

function getJustifyClass(alignment: ButtonStaticElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export default function ButtonStatic(
  props: SlateElementProps<ButtonStaticElement>,
) {
  const element = props.element as ButtonStaticElement;
  const variant = element.variant ?? "filled";
  const size = element.size ?? "md";
  const alignment = element.alignment ?? "left";
  const accentColor = element.backgroundColor ?? "var(--presentation-primary)";
  const textColor = element.textColor ?? element.color;
  const backgroundColor =
    element.backgroundColor ?? "var(--presentation-primary)";

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-sm"
      : size === "lg"
        ? "px-6 py-3 text-lg"
        : "px-4 py-2 text-base";

  const commonClasses =
    "inline-flex items-center gap-2 font-medium transition-(--presentation-transition)";

  const variantClasses =
    variant === "outline"
      ? "border"
      : variant === "ghost"
        ? "bg-transparent"
        : "";

  const style: React.CSSProperties = (() => {
    const baseStyle = {
      borderRadius: "var(--presentation-button-border-radius, 0.5rem)",
    };

    if (variant === "outline") {
      return {
        ...baseStyle,
        color: textColor ?? accentColor,
        backgroundColor: "transparent",
        borderColor: accentColor,
      } as React.CSSProperties;
    }
    if (variant === "ghost") {
      return {
        ...baseStyle,
        color: textColor ?? accentColor,
        backgroundColor: "transparent",
      } as React.CSSProperties;
    }
    return {
      ...baseStyle,
      backgroundColor,
      color: textColor ?? "var(--presentation-background)",
      boxShadow: "var(--presentation-button-shadow, 0 2px 4px rgba(0,0,0,0.1))",
    } as React.CSSProperties;
  })();

  return (
    <SlateElement
      {...props}
      className={cn(
        "relative my-1 flex w-full transition-all duration-300",
        getJustifyClass(alignment),
        props.className,
      )}
    >
      <div
        className={cn(
          "presentation-element",
          commonClasses,
          sizeClasses,
          variantClasses,
        )}
        style={style}
      >
        {props.children}
      </div>
    </SlateElement>
  );
}
