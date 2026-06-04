"use client";

import { nanoid } from "nanoid";

import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { getSlideAspectRatioForGenerationAspectRatio } from "@/lib/presentation/aspect-ratio";
import { usePresentationState } from "@/states/presentation-state";

export type InsertPosition = "before" | "after";

export function useSlideOperations() {
  const setSlides = usePresentationState((s) => s.setSlides);
  const setCurrentSlideId = usePresentationState((s) => s.setCurrentSlideId);
  const buildSlide = (slide?: PlateSlide): PlateSlide => {
    if (slide) {
      return slide;
    }

    const { generationAspectRatio } = usePresentationState.getState();

    return {
      content: [
        {
          type: "h1",
          children: [{ text: "" }],
        },
      ],
      id: nanoid(),
      alignment: "center",
      formatCategory: "presentation",
      aspectRatio: getSlideAspectRatioForGenerationAspectRatio(
        generationAspectRatio,
      ),
    };
  };

  const addSlide = (
    position: InsertPosition,
    id: string,
    slide?: PlateSlide,
  ) => {
    const newSlide = buildSlide(slide);
    const { slides } = usePresentationState.getState();
    const updatedSlides = [...slides];
    const index = slides.findIndex((slide) => slide.id === id);
    const insertIndex = position === "before" ? index : index + 1;
    updatedSlides.splice(insertIndex, 0, newSlide);
    setSlides(updatedSlides);
    setCurrentSlideId(newSlide.id);
  };

  const addFirstSlide = (slide?: PlateSlide) => {
    const newSlide = buildSlide(slide);
    const { slides } = usePresentationState.getState();

    if (slides.length === 0) {
      setSlides([newSlide]);
      setCurrentSlideId(newSlide.id);
      return;
    }

    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    setCurrentSlideId(newSlide.id);
  };

  const deleteSlide = (id: string) => {
    const { slides } = usePresentationState.getState();
    const updatedSlides = [...slides];
    const index = updatedSlides.findIndex((slide) => slide.id === id);
    updatedSlides.splice(index, 1);
    setSlides(updatedSlides);
  };

  return { addSlide, addFirstSlide, deleteSlide };
}
