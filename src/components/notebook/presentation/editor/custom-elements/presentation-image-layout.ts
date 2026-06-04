import type React from "react";

import { type ImageCropSettings } from "../../utils/types";

export const presentationImageAlignmentClasses = {
  center: "mx-auto",
  left: "mr-auto",
  right: "ml-auto",
} as const;

export function getPresentationImageCropStyles(
  cropSettings?: ImageCropSettings,
): React.CSSProperties {
  const objectPosition = cropSettings
    ? `${cropSettings.objectPosition.x}% ${cropSettings.objectPosition.y}%`
    : "50% 50%";

  return {
    objectFit: cropSettings?.objectFit ?? "cover",
    objectPosition,
    transform: `scale(${cropSettings?.zoom ?? 1})`,
    transformOrigin: objectPosition,
  };
}

export function getPresentationImageFrameStyles(
  cropSettings?: ImageCropSettings,
): React.CSSProperties {
  return {
    ...getPresentationImageCropStyles(cropSettings),
    borderRadius: "var(--presentation-border-radius, 0.5rem)",
    boxShadow: "var(--presentation-card-shadow, 0 1px 3px rgba(0,0,0,0.12))",
  };
}
