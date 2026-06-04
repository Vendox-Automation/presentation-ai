"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { PresentationIcon } from "@/components/notebook/presentation/editor/custom-elements/presentation-icon";
import { cn } from "@/lib/utils";
import { CALLOUT_VARIANTS, getCalloutVariant } from "./callout-variants";

type StaticCalloutElementData = {
  alignment?: unknown;
  backgroundColor?: unknown;
  color?: unknown;
  icon?: unknown;
  textColor?: unknown;
  variant?: unknown;
};

function getStaticCalloutElementData(
  element: unknown,
): StaticCalloutElementData {
  return typeof element === "object" && element !== null
    ? (element as StaticCalloutElementData)
    : {};
}

function isIconPickerName(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z][A-Za-z0-9]+$/.test(value.trim());
}

function getCalloutJustifyClass(alignment: unknown) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-start";
}

function getCalloutTextAlignClass(alignment: unknown) {
  if (alignment === "left") return "text-left";
  if (alignment === "right") return "text-right";
  return "text-left";
}

export function CalloutElementStatic({
  children,
  className,
  ...props
}: SlateElementProps) {
  const elementData = getStaticCalloutElementData(props.element);
  const variant = getCalloutVariant(elementData.variant);
  const variantConfig = CALLOUT_VARIANTS[variant];
  const icon = isIconPickerName(elementData.icon)
    ? elementData.icon
    : variantConfig.icon;
  const textColor =
    typeof elementData.textColor === "string"
      ? elementData.textColor
      : typeof elementData.color === "string"
        ? elementData.color
        : undefined;
  const backgroundColor =
    typeof elementData.backgroundColor === "string"
      ? elementData.backgroundColor
      : variantConfig.backgroundColor;
  const alignment = elementData.alignment;

  return (
    <SlateElement
      className={cn(
        "relative my-1 flex rounded-sm bg-muted p-4 pl-3",
        getCalloutJustifyClass(alignment),
        !textColor && variantConfig.textClassName,
        "**:data-[slate-node='element']:text-current!",
        className,
      )}
      style={{
        backgroundColor,
        color: textColor,
      }}
      {...props}
    >
      <div
        className={cn(
          "flex w-full gap-2 rounded-md",
          getCalloutJustifyClass(alignment),
        )}
      >
        <div
          className={cn(
            "size-6 shrink-0",
            !textColor && variantConfig.textClassName,
          )}
          style={{ color: textColor }}
        >
          <PresentationIcon
            icon={icon}
            fallbackIcon={variantConfig.icon}
            className="flex items-center justify-center"
            size={18}
          />
        </div>
        <div
          className={cn(
            "min-w-0 max-w-[calc(100%-2rem)]",
            getCalloutTextAlignClass(alignment),
          )}
        >
          {children}
        </div>
      </div>
    </SlateElement>
  );
}
