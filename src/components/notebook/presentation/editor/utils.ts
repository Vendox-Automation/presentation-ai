import { cva } from "class-variance-authority";

export type PresentationColumnSize = "sm" | "md" | "lg" | "xl";
export type IconListOrientation = "side" | "top";
export type IconListVariant = "icon" | "image";

const DEFAULT_ICON_LIST_MEDIA_SIZE = 40;
export const ICON_LIST_MEDIA_SIZE_BOUNDS = {
  min: 24,
  max: 160,
} as const;

export function getDefaultColumnSize(
  childCount: number,
): PresentationColumnSize {
  return childCount >= 4 ? "lg" : "md";
}

export const columnSizeVariant = cva("flex flex-wrap *:shrink *:grow", {
  variants: {
    columnSize: {
      sm: "*:flex-1",
      md: "*:basis-[calc(33.33%-2rem)]",
      lg: "*:basis-[calc(50%-2rem)]",
      xl: "*:basis-full",
    },
  },
});

export const iconListColumnSizeVariant = cva(
  "flex flex-wrap *:min-w-0 *:shrink *:grow",
  {
    variants: {
      columnSize: {
        sm: [
          "*:basis-full",
          "@[420px]/icon-list:*:basis-[calc(50%_-_0.75rem)]",
          "@[720px]/icon-list:*:basis-[calc(33.333%_-_1rem)]",
          "@[960px]/icon-list:*:basis-[calc(25%_-_1.125rem)]",
        ],
        md: [
          "*:basis-full",
          "@[420px]/icon-list:*:basis-[calc(50%_-_0.75rem)]",
          "@[720px]/icon-list:*:basis-[calc(33.333%_-_1rem)]",
        ],
        lg: [
          "*:basis-full",
          "@[420px]/icon-list:*:basis-[calc(50%_-_0.75rem)]",
        ],
        xl: "*:basis-full",
      },
    },
  },
);

export function getAlignmentClasses(
  alignment: "left" | "center" | "right" = "left",
) {
  switch (alignment) {
    case "left":
      return "text-left";
    case "right":
      return "text-right";
    case "center":
      return "text-center";
    default:
      return "text-left";
  }
}

export function getIconListMediaSize(value: unknown): number {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(parsedValue)) {
    return DEFAULT_ICON_LIST_MEDIA_SIZE;
  }

  return Math.min(
    ICON_LIST_MEDIA_SIZE_BOUNDS.max,
    Math.max(ICON_LIST_MEDIA_SIZE_BOUNDS.min, parsedValue),
  );
}

export function getIconListOrientation(
  value: unknown,
  childCount: number,
): IconListOrientation {
  if (childCount <= 1) {
    return "side";
  }

  return value === "top" ? "top" : "side";
}

export function getIconListVariant(value: unknown): IconListVariant {
  return value === "image" ? "image" : "icon";
}
