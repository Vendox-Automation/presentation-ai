"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { BASE_HEIGHT } from "@/hooks/presentation/useRootImageActions";
import { type PlateSlide } from "../../utils/parser";

const PRESENTING_ROOT_IMAGE_MAX_VIEWPORT_RATIO_DEFAULT = 0.5;
const PRESENTING_ROOT_IMAGE_MAX_VIEWPORT_RATIO_SMALL = 0.35;
const SMALL_VIEWPORT_HEIGHT_THRESHOLD = 700;

function getPresentingRootImageMaxViewportRatio(
  viewportHeight: number,
): number {
  if (viewportHeight <= SMALL_VIEWPORT_HEIGHT_THRESHOLD) {
    return PRESENTING_ROOT_IMAGE_MAX_VIEWPORT_RATIO_SMALL;
  }
  return PRESENTING_ROOT_IMAGE_MAX_VIEWPORT_RATIO_DEFAULT;
}

interface UseRootImageHeightOptions {
  isPresenting: boolean;
  initialContent?: PlateSlide;
}

interface UseRootImageHeightReturn {
  editorRef: React.RefObject<HTMLDivElement | null>;
  shouldCapRootImage: boolean;
  maxRootImageHeight: number | undefined;
  presentingRootImageHeight: number | undefined;
  presentingMaxRootImageHeight: number | undefined;
}

/**
 * Hook to size vertical root images for edit and present modes.
 * In edit mode, the image is capped to the editor height so it never exceeds
 * half of the slide. In present mode, the current ratio-based sizing is
 * preserved but the final computed height is capped to 50vh.
 */
export function useRootImageHeight({
  isPresenting,
  initialContent,
}: UseRootImageHeightOptions): UseRootImageHeightReturn {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorHeightPx, setEditorHeightPx] = useState<number | undefined>(
    undefined,
  );
  const [viewportHeightPx, setViewportHeightPx] = useState<number | undefined>(
    undefined,
  );

  const isVerticalRootImageLayout = useMemo(
    () =>
      Boolean(
        initialContent?.rootImage && initialContent.layoutType === "vertical",
      ),
    [initialContent?.layoutType, initialContent?.rootImage],
  );

  const shouldCapRootImage = useMemo(
    () => isVerticalRootImageLayout && !isPresenting,
    [isPresenting, isVerticalRootImageLayout],
  );

  const maxRootImageHeight = useMemo(() => {
    if (!shouldCapRootImage) return undefined;
    return editorHeightPx;
  }, [editorHeightPx, shouldCapRootImage]);

  const rootImageHeightRatio = useMemo(() => {
    if (!isVerticalRootImageLayout) return undefined;

    const rootImageHeight = initialContent?.rootImage?.size?.h ?? BASE_HEIGHT;
    if (rootImageHeight <= 0 || !editorHeightPx || editorHeightPx <= 0) {
      return undefined;
    }

    const totalSlideHeight = rootImageHeight + editorHeightPx;
    if (totalSlideHeight <= 0) return undefined;

    return Math.min(rootImageHeight / totalSlideHeight, 1);
  }, [
    editorHeightPx,
    initialContent?.rootImage?.size?.h,
    isVerticalRootImageLayout,
  ]);

  const presentingMaxRootImageHeight = useMemo(() => {
    if (!isPresenting || !isVerticalRootImageLayout || !viewportHeightPx) {
      return undefined;
    }

    const ratio = getPresentingRootImageMaxViewportRatio(viewportHeightPx);
    return Math.round(viewportHeightPx * ratio);
  }, [isPresenting, isVerticalRootImageLayout, viewportHeightPx]);

  const presentingRootImageHeight = useMemo(() => {
    if (
      !isPresenting ||
      !isVerticalRootImageLayout ||
      rootImageHeightRatio === undefined ||
      !viewportHeightPx
    ) {
      return undefined;
    }

    const calculatedHeight = Math.round(
      rootImageHeightRatio * viewportHeightPx,
    );

    if (!presentingMaxRootImageHeight) {
      return calculatedHeight;
    }

    return Math.min(calculatedHeight, presentingMaxRootImageHeight);
  }, [
    isPresenting,
    isVerticalRootImageLayout,
    rootImageHeightRatio,
    presentingMaxRootImageHeight,
    viewportHeightPx,
  ]);

  // Observe editor height changes
  useEffect(() => {
    if (!isVerticalRootImageLayout) {
      setEditorHeightPx(undefined);
      return;
    }

    const element = editorRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    let rafId = 0;
    const updateHeight = () => {
      const nextHeight = Math.round(element.getBoundingClientRect().height);
      setEditorHeightPx((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateHeight();
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateHeight);
    });
    observer.observe(element);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [
    isVerticalRootImageLayout,
    initialContent?.id,
    initialContent?.layoutType,
  ]);

  useEffect(() => {
    if (!isPresenting || !isVerticalRootImageLayout) {
      setViewportHeightPx(undefined);
      return;
    }

    const updateViewportHeight = () => {
      const element = editorRef.current;
      const slideRoot = element?.closest<HTMLElement>(
        '[data-slide-content="true"]',
      );
      const rootHeight = slideRoot?.clientHeight;
      const nextHeight =
        rootHeight && rootHeight > 0
          ? rootHeight
          : Math.max(
              window.innerHeight,
              Math.round(window.visualViewport?.height ?? 0),
            );
      setViewportHeightPx((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener(
        "resize",
        updateViewportHeight,
      );
    };
  }, [isPresenting, isVerticalRootImageLayout]);

  return {
    editorRef,
    shouldCapRootImage,
    maxRootImageHeight,
    presentingRootImageHeight,
    presentingMaxRootImageHeight,
  };
}
