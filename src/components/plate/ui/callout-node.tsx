"use client";

import { useBlockSelected } from "@platejs/selection/react";
import { PlateElement } from "platejs/react";
import type * as React from "react";

import { PresentationIcon } from "@/components/notebook/presentation/editor/custom-elements/presentation-icon";
import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { CALLOUT_VARIANTS, getCalloutVariant } from "./callout-variants";

type CalloutElementData = {
  alignment?: unknown;
  backgroundColor?: unknown;
  color?: unknown;
  icon?: unknown;
  textColor?: unknown;
  variant?: unknown;
};

function getCalloutElementData(element: unknown): CalloutElementData {
  return typeof element === "object" && element !== null
    ? (element as CalloutElementData)
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

export function CalloutElement({
  attributes,
  children,
  className,
  ...props
}: React.ComponentProps<typeof PlateElement>) {
  const isBlockSelected = useBlockSelected();
  const elementData = getCalloutElementData(props.element);
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

  const handleIconSelect = (iconName: string) => {
    const path = props.editor.api.findPath(props.element);
    if (!path) return;

    props.editor.tf.setNodes({ icon: iconName }, { at: path });
  };

  return (
    <PlateElement
      className={cn(
        "slate-selectable relative my-1 flex rounded-sm bg-muted p-4",
        getCalloutJustifyClass(alignment),
        !textColor && variantConfig.textClassName,
        isBlockSelected &&
          "before:pointer-events-none before:absolute before:inset-0 before:z-1 before:rounded-sm before:bg-brand/13 before:content-['']",
        "caret-current! **:caret-current!",
        "**:data-[slate-node='element']:text-current!",
        "**:[[placeholder]]:before:text-current! **:[[placeholder]]:before:opacity-70!",
        className,
      )}
      style={{
        backgroundColor,
        color: textColor,
      }}
      attributes={{
        ...attributes,
        "data-plate-open-context-menu": true,
      }}
      {...props}
    >
      <div
        className={cn(
          "relative z-2 flex w-full gap-2 rounded-md",
          getCalloutJustifyClass(alignment),
        )}
      >
        <IconPicker
          className={cn(
            "size-6 shrink-0 border-0 bg-transparent p-1 shadow-none hover:bg-muted-foreground/15",
            !textColor && variantConfig.textClassName,
          )}
          style={{ color: textColor }}
          defaultIcon={icon}
          onIconSelect={handleIconSelect}
          onIconRemove={() => handleIconSelect(variantConfig.icon)}
          placeholder={
            <PresentationIcon
              icon={variantConfig.icon}
              className="flex items-center justify-center"
              size={16}
            />
          }
          size="sm"
        />
        <div
          className={cn(
            "min-w-0 max-w-[calc(100%-2rem)]",
            getCalloutTextAlignClass(alignment),
          )}
        >
          {children}
        </div>
      </div>
    </PlateElement>
  );
}
