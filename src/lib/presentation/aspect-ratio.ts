import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";

export type PresentationGenerationAspectRatio = "dynamic" | "16:9";

export const DEFAULT_PRESENTATION_GENERATION_ASPECT_RATIO: PresentationGenerationAspectRatio =
  "dynamic";

export const DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO: NonNullable<
  PlateSlide["aspectRatio"]
> = { type: "fluid" };

export const PRESENTATION_GENERATION_ASPECT_RATIO_OPTIONS = [
  {
    label: "Dynamic",
    shortLabel: "Dynamic",
    value: "dynamic",
  },
  {
    label: "16:9",
    shortLabel: "16:9",
    value: "16:9",
  },
] as const;

export function normalizePresentationGenerationAspectRatio(
  value: unknown,
): PresentationGenerationAspectRatio {
  return value === "16:9" ? "16:9" : "dynamic";
}

export function getPresentationGenerationAspectRatioLabel(
  value: PresentationGenerationAspectRatio,
): string {
  return value === "16:9" ? "16:9" : "Dynamic";
}

export function getSlideAspectRatioForGenerationAspectRatio(
  value: PresentationGenerationAspectRatio,
): NonNullable<PlateSlide["aspectRatio"]> {
  return value === "16:9"
    ? { type: "ratio", value: "16:9" }
    : DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO;
}

export function applyGenerationAspectRatioToSlides(
  slides: PlateSlide[],
  value: PresentationGenerationAspectRatio,
): PlateSlide[] {
  const aspectRatio = getSlideAspectRatioForGenerationAspectRatio(value);

  return slides.map((slide) => ({
    ...slide,
    formatCategory: "presentation",
    aspectRatio,
  }));
}
