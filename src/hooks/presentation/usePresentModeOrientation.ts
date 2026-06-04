"use client";

import { useEffect, useState } from "react";

type PresentModeViewportState = {
  isPhoneViewport: boolean;
  isPortraitViewport: boolean;
};

function getViewportDimensions() {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: Math.max(
      window.innerWidth,
      Math.round(window.visualViewport?.width ?? 0),
    ),
    height: Math.max(
      window.innerHeight,
      Math.round(window.visualViewport?.height ?? 0),
    ),
  };
}

function isPhoneLikeViewport(width: number, height: number): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const smallerSide = Math.min(width, height);
  const largerSide = Math.max(width, height);
  const phoneSizedViewport = smallerSide <= 500 && largerSide <= 1000;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const hasTouchPoints = navigator.maxTouchPoints > 0;

  return phoneSizedViewport || coarsePointer || (noHover && hasTouchPoints);
}

function getPresentModeViewportState(): PresentModeViewportState {
  const { width, height } = getViewportDimensions();

  return {
    isPhoneViewport: isPhoneLikeViewport(width, height),
    isPortraitViewport: height > width,
  };
}

/**
 * Returns viewport dimensions for present mode scaling.
 * Always returns the actual viewport dimensions (no swapping).
 */
export function getPresentModeViewportDimensions() {
  const { width, height } = getViewportDimensions();

  return { width, height };
}

export function usePresentModeOrientation(isPresenting: boolean) {
  const [viewportState, setViewportState] = useState<PresentModeViewportState>(
    () => getPresentModeViewportState(),
  );

  useEffect(() => {
    if (!isPresenting) {
      setViewportState(getPresentModeViewportState());
      return;
    }

    const updateViewportState = () => {
      setViewportState(getPresentModeViewportState());
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState, { passive: true });
    window.addEventListener("orientationchange", updateViewportState);
    window.visualViewport?.addEventListener("resize", updateViewportState);

    return () => {
      window.removeEventListener("resize", updateViewportState);
      window.removeEventListener("orientationchange", updateViewportState);
      window.visualViewport?.removeEventListener("resize", updateViewportState);
    };
  }, [isPresenting]);

  return viewportState;
}
