"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

interface PresentModePhoneOverlayProps {
  isPhoneViewport: boolean;
  slideIds: string[];
}

interface PointerGesture {
  pointerId: number;
  startX: number;
  startY: number;
}

const TAP_DISTANCE_THRESHOLD = 12;
const SWIPE_DISTANCE_THRESHOLD = 56;

function isPortraitRatio(value?: string): boolean {
  if (!value) return false;

  const parts = value.split(":").map(Number);
  if (parts.length !== 2) {
    return false;
  }

  const width = parts[0] ?? Number.NaN;
  const height = parts[1] ?? Number.NaN;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0) {
    return false;
  }

  return height > width;
}

function isPhoneFormattedSlide(slide?: PlateSlide): boolean {
  if (!slide) return false;

  if (slide.aspectRatio?.type === "tall") {
    return true;
  }

  if (slide.aspectRatio?.type === "ratio") {
    return isPortraitRatio(slide.aspectRatio.value);
  }

  return false;
}

export function PresentModePhoneOverlay({
  isPhoneViewport,
  slideIds,
}: PresentModePhoneOverlayProps) {
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const currentSlide = usePresentationState((s) =>
    s.slides.find((slide) => slide.id === s.currentSlideId),
  );
  const nextSlide = usePresentationState((s) => s.nextSlide);
  const previousSlide = usePresentationState((s) => s.previousSlide);
  const setShouldShowExitHeader = usePresentationState(
    (s) => s.setShouldShowExitHeader,
  );
  const gestureRef = useRef<PointerGesture | null>(null);
  const shouldShowForViewport =
    isPhoneViewport || isPhoneFormattedSlide(currentSlide);

  if (!isPresenting || !shouldShowForViewport || slideIds.length <= 1) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const navigateFromTap = (
    event: ReactPointerEvent<HTMLDivElement>,
    deltaX: number,
    deltaY: number,
  ) => {
    if (
      Math.abs(deltaX) > TAP_DISTANCE_THRESHOLD ||
      Math.abs(deltaY) > TAP_DISTANCE_THRESHOLD
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const tapX = event.clientX - bounds.left;
    if (tapX >= bounds.width / 2) {
      nextSlide();
      return;
    }

    previousSlide();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) return;

    setShouldShowExitHeader(false);

    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    gestureRef.current = null;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    gestureRef.current = null;

    if (
      Math.abs(deltaX) >= SWIPE_DISTANCE_THRESHOLD &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX > 0) {
        nextSlide();
        return;
      }

      previousSlide();
      return;
    }

    navigateFromTap(event, deltaX, deltaY);
  };

  return createPortal(
    <>
      {/* Top area to toggle header */}
      <button
        type="button"
        className="pointer-events-auto fixed inset-x-0 top-0 z-999 h-20"
        onClick={() => setShouldShowExitHeader(true)}
        aria-label="Show presentation exit controls"
      />
      {/* Navigator area */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-20 z-1000">
        <div
          className={cn(
            "pointer-events-auto absolute inset-0 z-2147483646 select-none",
            "touch-pan-y",
          )}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          aria-label="Phone presentation navigation overlay"
          role="application"
        >
          <div className="absolute inset-y-0 left-0 w-1/2" />
          <div className="absolute inset-y-0 right-0 w-1/2" />
        </div>
      </div>
    </>,
    document.body,
  );
}
