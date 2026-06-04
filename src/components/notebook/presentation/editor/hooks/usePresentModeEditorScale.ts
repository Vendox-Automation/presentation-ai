"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";

import { getSlideBaseWidth } from "@/config/slideFormats";
import { DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO } from "@/lib/presentation/aspect-ratio";
import { type PlateSlide } from "../../utils/parser";

const MAX_FIT_OVERFLOW_RATIO = 4;
const SCROLL_EXIT_OVERFLOW_RATIO = 3.9;
const SCROLL_MODE_TARGET_OVERFLOW_RATIO = 2;
const MIN_PRESENT_SCALE = 0.1;
const MEASUREMENT_TOLERANCE_PX = 2;

interface PresentModeEditorScaleOptions {
  isPresenting: boolean;
  initialContent?: PlateSlide;
  editorRef: RefObject<HTMLDivElement | null>;
  regionRef: RefObject<HTMLDivElement | null>;
}

interface PresentModeEditorScale {
  contentScale: number;
  logicalWidth?: number;
  scaledContentHeight: number;
  shouldScroll: boolean;
  topOffset: number;
  leftOffset: number;
}

interface PresentModeMeasurements {
  regionWidth: number;
  regionHeight: number;
  rootWidth: number;
  contentHeight: number;
}

function getViewportHeight() {
  return Math.max(
    1,
    Math.round(window.visualViewport?.height ?? window.innerHeight),
  );
}

function getRegionHeightBudget(
  regionElement: HTMLElement,
  rootElement: HTMLElement | null,
) {
  const slideRoot =
    rootElement ??
    regionElement.closest<HTMLElement>('[data-slide-content="true"]');

  const rootHeight =
    slideRoot && slideRoot.clientHeight > 0
      ? slideRoot.clientHeight
      : getViewportHeight();

  if (!slideRoot) return rootHeight;

  const rootImage = slideRoot.querySelector<HTMLElement>("[data-root-image]");
  if (!rootImage) return rootHeight;

  const rootImageRect = rootImage.getBoundingClientRect();
  const isVerticalLayout = rootImageRect.width >= slideRoot.clientWidth * 0.8;

  if (!isVerticalLayout) {
    return rootHeight;
  }

  return Math.max(1, rootHeight - rootImageRect.height);
}

function hasMeaningfulMeasurementChange(
  previous: PresentModeMeasurements,
  next: PresentModeMeasurements,
) {
  return (
    Math.abs(previous.regionWidth - next.regionWidth) >
      MEASUREMENT_TOLERANCE_PX ||
    Math.abs(previous.regionHeight - next.regionHeight) >
      MEASUREMENT_TOLERANCE_PX ||
    Math.abs(previous.rootWidth - next.rootWidth) > MEASUREMENT_TOLERANCE_PX ||
    Math.abs(previous.contentHeight - next.contentHeight) >
      MEASUREMENT_TOLERANCE_PX
  );
}

function getAlignmentOffset(
  alignment: PlateSlide["alignment"],
  availableSpace: number,
) {
  if (availableSpace <= 0) return 0;
  if (alignment === "start") return 0;
  if (alignment === "end") return availableSpace;
  return availableSpace / 2;
}

function getLogicalSlideWidth(initialContent: PlateSlide | undefined) {
  return getSlideBaseWidth(
    initialContent?.formatCategory ?? "presentation",
    (initialContent?.width ?? "M") as "S" | "M" | "L",
    initialContent?.aspectRatio ?? DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO,
  );
}

export function usePresentModeEditorScale({
  isPresenting,
  initialContent,
  editorRef,
  regionRef,
}: PresentModeEditorScaleOptions): PresentModeEditorScale {
  const [measurements, setMeasurements] = useState<PresentModeMeasurements>({
    regionWidth: 0,
    regionHeight: 0,
    rootWidth: 0,
    contentHeight: 0,
  });
  const [isScrollMode, setIsScrollMode] = useState(false);

  const logicalSlideWidth = useMemo(
    () => getLogicalSlideWidth(initialContent),
    [initialContent],
  );

  useEffect(() => {
    if (!isPresenting) {
      setMeasurements({
        regionWidth: 0,
        regionHeight: 0,
        rootWidth: 0,
        contentHeight: 0,
      });
      setIsScrollMode(false);
      return;
    }

    const regionElement = regionRef.current;
    const editorElement = editorRef.current;
    if (!regionElement || !editorElement) return;

    let rafId = 0;

    const updateMeasurements = () => {
      const rootElement = regionElement.closest<HTMLElement>(
        '[data-slide-content="true"]',
      );
      const nextMeasurements: PresentModeMeasurements = {
        regionWidth: Math.round(regionElement.clientWidth),
        regionHeight: Math.round(
          getRegionHeightBudget(regionElement, rootElement),
        ),
        rootWidth: Math.round(rootElement?.clientWidth ?? window.innerWidth),
        contentHeight: Math.round(editorElement.scrollHeight),
      };

      setMeasurements((previous) => {
        if (!hasMeaningfulMeasurementChange(previous, nextMeasurements)) {
          return previous;
        }
        return nextMeasurements;
      });
    };

    const scheduleMeasurement = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateMeasurements);
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(scheduleMeasurement);
    resizeObserver.observe(regionElement);
    resizeObserver.observe(editorElement);

    const rootElement = regionElement.closest<HTMLElement>(
      '[data-slide-content="true"]',
    );
    if (rootElement) {
      resizeObserver.observe(rootElement);
      const rootImage =
        rootElement.querySelector<HTMLElement>("[data-root-image]");
      if (rootImage) {
        resizeObserver.observe(rootImage);
      }
    }

    window.addEventListener("resize", scheduleMeasurement, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleMeasurement);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasurement);
      window.visualViewport?.removeEventListener("resize", scheduleMeasurement);
    };
  }, [editorRef, isPresenting, regionRef]);

  const overflowRatio = useMemo(() => {
    const { regionHeight, rootWidth, contentHeight } = measurements;

    if (
      !isPresenting ||
      regionHeight <= 0 ||
      rootWidth <= 0 ||
      logicalSlideWidth <= 0
    ) {
      return 1;
    }

    const baseScale = Math.max(
      rootWidth / logicalSlideWidth,
      MIN_PRESENT_SCALE,
    );
    const visualHeightAtBaseScale = contentHeight * baseScale;
    return visualHeightAtBaseScale / regionHeight;
  }, [isPresenting, logicalSlideWidth, measurements]);

  useEffect(() => {
    if (!isPresenting) {
      setIsScrollMode(false);
      return;
    }

    setIsScrollMode((previous) => {
      if (previous) {
        return overflowRatio > SCROLL_EXIT_OVERFLOW_RATIO;
      }
      return overflowRatio > MAX_FIT_OVERFLOW_RATIO;
    });
  }, [isPresenting, overflowRatio]);

  return useMemo(() => {
    const { regionWidth, regionHeight, rootWidth, contentHeight } =
      measurements;

    if (
      !isPresenting ||
      regionWidth <= 0 ||
      regionHeight <= 0 ||
      rootWidth <= 0 ||
      logicalSlideWidth <= 0
    ) {
      return {
        contentScale: 1,
        logicalWidth: undefined,
        scaledContentHeight: 0,
        shouldScroll: false,
        topOffset: 0,
        leftOffset: 0,
      };
    }

    const baseScale = Math.max(
      rootWidth / logicalSlideWidth,
      MIN_PRESENT_SCALE,
    );
    const logicalWidth = regionWidth / baseScale;
    const visualHeightAtBaseScale = contentHeight * baseScale;
    const shouldFitOverflow = overflowRatio > 1 && !isScrollMode;
    const shouldScroll = isScrollMode;
    const fitScale = shouldFitOverflow
      ? regionHeight / Math.max(visualHeightAtBaseScale, 1)
      : shouldScroll
        ? Math.min(1, SCROLL_MODE_TARGET_OVERFLOW_RATIO / overflowRatio)
        : 1;
    const contentScale = baseScale * fitScale;
    const scaledContentHeight = contentHeight * contentScale;
    const visualContentWidth = logicalWidth * contentScale;
    const topOffset = shouldScroll
      ? 0
      : getAlignmentOffset(
          initialContent?.alignment,
          regionHeight - scaledContentHeight,
        );
    const leftOffset = Math.max((regionWidth - visualContentWidth) / 2, 0);

    return {
      contentScale,
      logicalWidth,
      scaledContentHeight,
      shouldScroll,
      topOffset,
      leftOffset,
    };
  }, [
    initialContent?.alignment,
    isPresenting,
    isScrollMode,
    logicalSlideWidth,
    measurements,
    overflowRatio,
  ]);
}
