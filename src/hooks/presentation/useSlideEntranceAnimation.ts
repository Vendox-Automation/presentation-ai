import { type RefObject, useEffect } from "react";

import { type PresentationAnimationLevel } from "@/states/presentation-state";

/**
 * Per-level entrance tuning. Larger travel + longer duration + wider stagger
 * reads as "more animated". Kept intentionally small (3 levels) so the effect
 * stays tasteful rather than chaotic.
 */
const LEVEL_CONFIG: Record<
  Exclude<PresentationAnimationLevel, "off">,
  { distance: number; duration: number; stagger: number }
> = {
  subtle: { distance: 8, duration: 300, stagger: 40 },
  balanced: { distance: 22, duration: 480, stagger: 80 },
  dynamic: { distance: 44, duration: 640, stagger: 130 },
};

const EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Resolve the set of elements to stagger. Prefer the top-level blocks of the
 * slide's rich-text editor; if that root wraps everything in a single
 * container, drill one level so we still get a staggered reveal rather than
 * one big fade.
 */
function resolveTargets(root: HTMLElement): HTMLElement[] {
  const editor = root.querySelector<HTMLElement>("[data-slate-editor]");
  let candidates: Element[] = editor
    ? Array.from(editor.children)
    : Array.from(root.children);

  if (candidates.length === 1 && candidates[0]!.children.length > 1) {
    candidates = Array.from(candidates[0]!.children);
  }

  return candidates.filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
}

/**
 * Animate a slide's content in when it becomes the active slide during present
 * mode. No-op while editing, when animations are off, or when the viewer has
 * requested reduced motion. Uses the Web Animations API so we don't have to
 * wrap every rich-text node in a motion component (which would risk layout and
 * export regressions).
 */
export function useSlideEntranceAnimation({
  contentRef,
  isActive,
  isPresenting,
  level,
}: {
  contentRef: RefObject<HTMLElement | null>;
  isActive: boolean;
  isPresenting: boolean;
  level: PresentationAnimationLevel;
}) {
  useEffect(() => {
    if (!isPresenting || !isActive || level === "off") return;
    if (prefersReducedMotion()) return;

    const root = contentRef.current;
    if (!root) return;

    const targets = resolveTargets(root);
    if (targets.length === 0) return;

    const { distance, duration, stagger } = LEVEL_CONFIG[level];

    const animations = targets.map((el, index) =>
      el.animate(
        [
          { opacity: 0, transform: `translateY(${distance}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration,
          delay: index * stagger,
          easing: EASING,
          fill: "both",
        },
      ),
    );

    return () => {
      // Reverting to the element's natural (visible) style if we leave mid-run.
      animations.forEach((animation) => animation.cancel());
    };
  }, [contentRef, isActive, isPresenting, level]);
}
