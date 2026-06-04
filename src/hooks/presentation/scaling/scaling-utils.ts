import {
  BASE_WIDTHS,
  FORMAT_CATEGORY_WIDTHS,
  SOCIAL_ASPECT_WIDTHS,
} from "@/config/slideFormats";

/**
 * Export baseWidths for backward compatibility.
 * This is a flattened export of the config values.
 */
export const baseWidths = {
  S: BASE_WIDTHS.S,
  M: BASE_WIDTHS.M,
  L: BASE_WIDTHS.L,
  social: SOCIAL_ASPECT_WIDTHS.default,
  document: FORMAT_CATEGORY_WIDTHS.document,
  webpage: FORMAT_CATEGORY_WIDTHS.webpage,
  presentation: FORMAT_CATEGORY_WIDTHS.presentation,
  default: FORMAT_CATEGORY_WIDTHS.default,
};

/**
 * Interface for slide scaling configuration.
 */
export interface SlideScalingConfig {
  scale: number;
  slideWidth: number;
  fontSize: number;
  scaledHeight?: number;
  contentHeight: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
  minHeight?: number;
  presentFitScale: number;
  isScaleLocked?: boolean;
}
