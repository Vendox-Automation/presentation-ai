import { type PlateSlide } from "../../utils/parser";

export function slideSignature(slide?: PlateSlide): string {
  return JSON.stringify(slide ?? null);
}
