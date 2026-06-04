"use client";

import { cva } from "class-variance-authority";
import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
  type TBulletGroupElement,
  type TBulletItemElement,
} from "../plugins/bullet-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { getSiblingIndexContext } from "./sibling-index";

export const bulletItemVariants = cva("", {
  variants: {
    bulletType: {
      numbered: "flex items-start",
      basic: "flex items-start",
      arrow: "flex items-start",
    },
  },
});

export const bulletMarkerVariants = cva("shrink-0", {
  variants: {
    bulletType: {
      numbered:
        "flex size-12 items-center justify-center rounded-md bg-primary text-xl font-bold text-primary-foreground",
      basic: "mt-1 flex size-6 items-center justify-center rounded-full",
      arrow: "mt-1 flex size-6 items-center justify-center",
    },
  },
});

// Arrow SVG component for arrow bullet type
export const ArrowMarker = ({ color }: { color: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 155.139 155.139"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      fill={color}
      points="155.139,77.566 79.18,1.596 79.18,45.978 0,45.978 0,109.155 79.18,109.155 79.18,153.542"
    />
  </svg>
);

// BulletItem component for numbered blocks with content
export const BulletItem = (props: PlateElementProps<TBulletItemElement>) => {
  const { index, parentElement } = getSiblingIndexContext<TBulletGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TBulletGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;
  const bulletType = resolvedParentElement?.bulletType ?? "numbered";

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = resolvedParentElement?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";
  const { icon } = props.element;
  const markerColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    "var(--presentation-primary)",
  );

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  const markerPlaceholder =
    bulletType === "numbered" ? (
      <span className="text-xl font-bold">{index + 1}</span>
    ) : bulletType === "arrow" ? (
      <ArrowMarker color={markerColor} />
    ) : (
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: markerColor }}
      />
    );

  // Force sibling refresh when index changes
  return (
    <PlateElement {...props} className={cn("group/bullet-item relative")}>
      {/* The bullet item layout with numbered block and content */}
      <div
        className={cn(
          "gap-3",
          bulletItemVariants({ bulletType }),
          alignment === "right" && "flex-row-reverse",
        )}
      >
        {/* Bullet marker - numbered, basic dot, or arrow */}
        <IconPicker
          defaultIcon={icon}
          placeholder={markerPlaceholder}
          onIconSelect={(iconName) => handleIconSelect(iconName)}
          onIconRemove={() => {
            const itemPath = props.editor.api.findPath(props.element);
            if (!itemPath) return;
            props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
          }}
          className={cn(
            bulletMarkerVariants({ bulletType }),
            "shadow-none hover:opacity-80",
            bulletType === "numbered" && "text-primary-foreground",
            bulletType !== "numbered" && "border-transparent bg-transparent",
          )}
          size={bulletType === "numbered" ? "lg" : "md"}
          data-decor="true"
          style={{
            backgroundColor:
              bulletType === "numbered" ? markerColor : "transparent",
            borderColor: "transparent",
            color:
              bulletType === "numbered"
                ? "var(--presentation-background)"
                : markerColor,
          }}
        />

        <div className={cn("flex-1", getAlignmentClasses(alignment))}>
          {props.children}
        </div>
      </div>
    </PlateElement>
  );
};
