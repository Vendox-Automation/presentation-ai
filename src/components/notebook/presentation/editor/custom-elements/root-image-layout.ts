import type React from "react";

import { type RootImage as RootImageType } from "../../utils/parser";
import { type ImageCropSettings } from "../../utils/types";

export const BASE_WIDTH_PERCENTAGE = "45%";
export const BASE_HEIGHT = 384;
export const MIN_WIDTH_PERCENTAGE = 20;
export const MAX_WIDTH_PERCENTAGE = 80;
export const MIN_HEIGHT = 200;
export const MAX_HEIGHT = 800;

export function getRootImageCropSettings(
  image: RootImageType,
): ImageCropSettings {
  return (
    image.cropSettings ?? {
      objectFit: "cover",
      objectPosition: { x: 50, y: 50 },
      zoom: 1,
    }
  );
}

export function getRootImageObjectStyles(
  image: RootImageType,
): React.CSSProperties {
  const cropSettings = getRootImageCropSettings(image);

  return {
    objectFit: cropSettings.objectFit,
    objectPosition: `${cropSettings.objectPosition.x}% ${cropSettings.objectPosition.y}%`,
    transform: `scale(${cropSettings.zoom ?? 1})`,
    transformOrigin: `${cropSettings.objectPosition.x}% ${cropSettings.objectPosition.y}%`,
    height: "100%",
    width: "100%",
    display: "block",
  };
}

export function getRootImageSizeStyle(
  image: RootImageType,
  layoutType?: string,
): React.CSSProperties {
  const hasExplicitHeight = Boolean(image.size?.h);
  const hasExplicitWidth = Boolean(image.size?.w);

  if (!hasExplicitHeight && !hasExplicitWidth) {
    if (layoutType === "vertical") {
      return { height: BASE_HEIGHT, width: "100%" };
    }
    return { width: BASE_WIDTH_PERCENTAGE, height: "auto" };
  }

  if (layoutType === "vertical") {
    return { height: image.size?.h ?? BASE_HEIGHT, width: "100%" };
  }

  return { width: image.size?.w ?? BASE_WIDTH_PERCENTAGE, height: "auto" };
}
