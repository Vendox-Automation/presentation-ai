import { useEffect, useRef } from "react";

import { usePresentationState } from "@/states/presentation-state";

interface UsePresentationAutoScrollOptions {
  viewportElement: HTMLDivElement | null;
  scrollElement: HTMLDivElement | null;
  bottomThreshold?: number;
  disabled?: boolean;
}

function isAtBottom(
  viewportElement: HTMLDivElement,
  bottomThreshold: number,
): boolean {
  return (
    viewportElement.scrollHeight -
      viewportElement.scrollTop -
      viewportElement.clientHeight <=
    bottomThreshold
  );
}

export function usePresentationAutoScroll({
  viewportElement,
  scrollElement,
  bottomThreshold = 24,
  disabled = false,
}: UsePresentationAutoScrollOptions) {
  const isGeneratingPresentation = usePresentationState(
    (state) => state.isGeneratingPresentation,
  );
  const slides = usePresentationState((state) => state.slides);

  const hasUserScrolledUpRef = useRef(false);
  const hasPendingWheelRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const scrollFrameRef = useRef<number | null>(null);

  function stopAutoScroll() {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }

    isProgrammaticScrollRef.current = false;
  }

  function getBottomTargetTop(): number {
    if (!viewportElement || !scrollElement) {
      return 0;
    }

    return Math.max(
      0,
      scrollElement.offsetTop +
        scrollElement.offsetHeight -
        viewportElement.clientHeight,
    );
  }

  function smoothScrollToBottom() {
    if (
      disabled ||
      !isGeneratingPresentation ||
      !viewportElement ||
      !scrollElement ||
      hasUserScrolledUpRef.current
    ) {
      return;
    }

    if (scrollFrameRef.current !== null) {
      return;
    }

    const step = () => {
      if (
        disabled ||
        !isGeneratingPresentation ||
        !viewportElement ||
        !scrollElement ||
        hasUserScrolledUpRef.current
      ) {
        stopAutoScroll();
        return;
      }

      const targetTop = getBottomTargetTop();
      const currentTop = viewportElement.scrollTop;
      const delta = targetTop - currentTop;

      if (Math.abs(delta) <= 1) {
        viewportElement.scrollTo({
          top: targetTop,
          behavior: "auto",
        });
        stopAutoScroll();
        return;
      }

      isProgrammaticScrollRef.current = true;

      viewportElement.scrollTo({
        top: currentTop + delta * 0.18,
        behavior: "auto",
      });

      scrollFrameRef.current = window.requestAnimationFrame(step);
    };

    scrollFrameRef.current = window.requestAnimationFrame(step);
  }

  useEffect(() => {
    if (disabled || !viewportElement) {
      return;
    }

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        stopAutoScroll();
        hasPendingWheelRef.current = false;
        hasUserScrolledUpRef.current = true;
        return;
      }

      if (isProgrammaticScrollRef.current) {
        return;
      }

      hasPendingWheelRef.current = true;
    };

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) {
        return;
      }

      const atBottom = isAtBottom(viewportElement, bottomThreshold);

      if (atBottom) {
        hasUserScrolledUpRef.current = false;
        hasPendingWheelRef.current = false;
        return;
      }

      if (hasPendingWheelRef.current) {
        hasUserScrolledUpRef.current = true;
        hasPendingWheelRef.current = false;
      }
    };

    viewportElement.addEventListener("wheel", handleWheel, { passive: true });
    viewportElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      viewportElement.removeEventListener("wheel", handleWheel);
      viewportElement.removeEventListener("scroll", handleScroll);
    };
  }, [bottomThreshold, disabled, viewportElement]);

  useEffect(() => {
    if (!isGeneratingPresentation || disabled) {
      stopAutoScroll();
      hasUserScrolledUpRef.current = false;
      hasPendingWheelRef.current = false;
      return;
    }

    smoothScrollToBottom();
  }, [
    disabled,
    isGeneratingPresentation,
    slides,
    viewportElement,
    scrollElement,
  ]);

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, []);
}
