import { useEffect, useRef } from "react";

import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { usePresentationState } from "@/states/presentation-state";
import { useDebouncedSave } from "./useDebouncedSave";

interface UseSlideChangeWatcherOptions {
  /**
   * The delay in milliseconds before triggering a save.
   * @default 1000
   */
  debounceDelay?: number;
  /**
   * Whether the watcher should be active
   * @default true
   */
  enabled?: boolean;
}

/**
 * A hook that watches for changes to the slides and triggers
 * a debounced save function whenever changes are detected.
 */
export const useSlideChangeWatcher = (
  options: UseSlideChangeWatcherOptions = {},
) => {
  const { debounceDelay = 1000, enabled = true } = options;
  const currentPresentationId = usePresentationState(
    (s) => s.currentPresentationId,
  );
  const contentVersion = usePresentationState((s) => s.contentVersion);
  const slides = usePresentationState((s) => s.slides);
  const { save, saveImmediately } = useDebouncedSave({ delay: debounceDelay });

  const baselineKeyRef = useRef<string | null>(null);
  const prevSlidesRef = useRef<PlateSlide[]>([]);

  // Watch for changes to the slides array and trigger save
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const { isGeneratingPresentation } = usePresentationState.getState();
    if (isGeneratingPresentation) {
      return;
    }

    if (!currentPresentationId || slides.length === 0) {
      baselineKeyRef.current = null;
      prevSlidesRef.current = slides;
      return;
    }

    const nextBaselineKey = `${currentPresentationId}:${contentVersion}`;
    if (baselineKeyRef.current !== nextBaselineKey) {
      baselineKeyRef.current = nextBaselineKey;
      prevSlidesRef.current = slides;
      return;
    }

    if (JSON.stringify(slides) === JSON.stringify(prevSlidesRef.current)) {
      return;
    }

    prevSlidesRef.current = slides;
    save();
  }, [contentVersion, currentPresentationId, enabled, save, slides]);

  return {
    saveImmediately,
  };
};
