"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { type TButtonElement } from "../plugins/button-plugin";

function getJustifyClass(alignment: TButtonElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export default function ButtonElement({
  attributes,
  ...props
}: PlateElementProps<TButtonElement>) {
  const variant = props.element.variant ?? "filled";
  const size = props.element.size ?? "md";
  const alignment = props.element.alignment ?? "left";
  const accentColor =
    props.element.backgroundColor ?? "var(--presentation-primary)";
  const textColor = props.element.textColor ?? props.element.color;
  const backgroundColor =
    props.element.backgroundColor ??
    (variant === "filled" ? "var(--presentation-primary)" : "transparent");

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
      ? "border" // colors styled inline via CSS vars below
      : variant === "ghost"
        ? "bg-transparent"
        : "";

  const style: React.CSSProperties = (() => {
    const baseStyle = {
      borderRadius: "var(--presentation-button-border-radius)",
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
    // filled
    return {
      ...baseStyle,
      backgroundColor,
      color: textColor ?? "var(--presentation-background)",
      boxShadow: "var(--presentation-button-shadow, 0 2px 4px rgba(0,0,0,0.1))",
    } as React.CSSProperties;
  })();

  return (
    <PlateElement
      {...props}
      className={cn("relative my-1 flex w-full", getJustifyClass(alignment))}
      attributes={{
        ...attributes,
        "data-plate-open-context-menu": true,
      }}
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
    </PlateElement>
  );
}
