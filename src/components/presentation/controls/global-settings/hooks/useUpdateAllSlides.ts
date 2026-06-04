"use client";

import { useCallback } from "react";

import { usePresentationState } from "@/states/presentation-state";
import { type SlideUpdate } from "../types";

export function useUpdateAllSlides() {
  const { slides, setSlides } = usePresentationState();

  return useCallback(
    (updates: Partial<SlideUpdate>) => {
      const updatedSlides = slides.map((slide) => ({
        ...slide,
        ...updates,
      }));
      setSlides(updatedSlides);
    },
    [slides, setSlides],
  );
}
