import { type RefObject, useLayoutEffect } from "react";

import {
  autoEffectFor,
  buildAnimationKeyframes,
  classifySlideElement,
  getLevelTiming,
  SLIDE_ANIMATION_EFFECTS,
  type SlideAnimationOverride,
} from "@/lib/presentation/slide-animations";
import { type PresentationAnimationLevel } from "@/states/presentation-state";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const VALID_EFFECTS = new Set(SLIDE_ANIMATION_EFFECTS.map((e) => e.effect));

/** Read a validated animation override off a Plate node, if present. */
function readOverride(node: unknown): SlideAnimationOverride | undefined {
  if (!node || typeof node !== "object") return undefined;
  const anim = (node as { animation?: unknown }).animation;
  if (!anim || typeof anim !== "object") return undefined;
  const effect = (anim as { effect?: unknown }).effect;
  if (typeof effect !== "string" || !VALID_EFFECTS.has(effect as never)) {
    return undefined;
  }
  const direction = (anim as { direction?: unknown }).direction;
  return {
    effect: effect as SlideAnimationOverride["effect"],
    direction:
      direction === "up" ||
      direction === "down" ||
      direction === "left" ||
      direction === "right"
        ? direction
        : undefined,
  };
}

/** Recursively index a slide's content nodes by their block id. */
function indexNodesById(
  nodes: unknown,
  map: Map<string, unknown>,
): Map<string, unknown> {
  if (!Array.isArray(nodes)) return map;
  for (const node of nodes) {
    if (node && typeof node === "object") {
      const id = (node as { id?: unknown }).id;
      if (typeof id === "string") map.set(id, node);
      const children = (node as { children?: unknown }).children;
      if (Array.isArray(children)) indexNodesById(children, map);
    }
  }
  return map;
}

/** Leaf content blocks: elements with an id that contain no nested id blocks. */
function resolvePlateLeafTargets(root: HTMLElement): HTMLElement[] {
  const withId = Array.from(
    root.querySelectorAll<HTMLElement>("[data-block-id]"),
  );
  return withId.filter((el) => !el.querySelector("[data-block-id]"));
}

/**
 * The slide's root/hero image is not a Plate node (it's rendered by a plain
 * React component driven by slide.rootImage), so it never carries
 * data-block-id. It does carry data-root-image on several nested wrappers;
 * the innermost one is the actual content box.
 */
function resolveRootImageTarget(root: HTMLElement): HTMLElement | undefined {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>("[data-root-image]"),
  );
  return candidates.find((el) => !el.querySelector("[data-root-image]"));
}

/**
 * Animate a slide's content in when it becomes the active slide during present
 * mode. Each leaf content block gets an entrance effect: its own per-element
 * override if set, otherwise the deck-level's auto choreography for that kind
 * of element (image / heading / text / list). No-op while editing, when off,
 * behind the loading overlay, or under reduced-motion.
 */
export function useSlideEntranceAnimation({
  contentRef,
  slideContent,
  rootImageAnimation,
  isActive,
  isPresenting,
  isPresentingLoading,
  level,
}: {
  contentRef: RefObject<HTMLElement | null>;
  slideContent: unknown;
  /** slide.rootImage?.animation — not part of the Plate node tree. */
  rootImageAnimation?: unknown;
  isActive: boolean;
  isPresenting: boolean;
  isPresentingLoading: boolean;
  level: PresentationAnimationLevel;
}) {
  // useLayoutEffect so the opening keyframe applies before the revealed slide
  // paints (no flash of fully-visible content).
  useLayoutEffect(() => {
    if (!isPresenting || !isActive || level === "off") return;
    if (isPresentingLoading) return;
    if (prefersReducedMotion()) return;

    const root = contentRef.current;
    if (!root) return;

    const plateTargets = resolvePlateLeafTargets(root);
    const rootImageTarget = resolveRootImageTarget(root);
    const targets: { el: HTMLElement; isRootImage: boolean }[] = [
      ...(rootImageTarget ? [{ el: rootImageTarget, isRootImage: true }] : []),
      ...plateTargets.map((el) => ({ el, isRootImage: false })),
    ];
    if (targets.length === 0) return;

    const nodesById = indexNodesById(slideContent, new Map());
    const { duration, stagger, distance } = getLevelTiming(level);
    const validatedRootImageOverride = readOverride({
      animation: rootImageAnimation,
    });
    // Cap the total stagger window so slides with many bullets/items still
    // finish revealing within a couple seconds rather than trickling in.
    const MAX_STAGGER_WINDOW_MS = 900;
    const effectiveStagger =
      targets.length > 1
        ? Math.min(stagger, MAX_STAGGER_WINDOW_MS / (targets.length - 1))
        : stagger;

    const animations = targets.map(({ el, isRootImage }, index) => {
      const override = isRootImage
        ? validatedRootImageOverride
        : readOverride(nodesById.get(el.getAttribute("data-block-id") ?? ""));
      const resolved =
        override ??
        autoEffectFor(level, isRootImage ? "image" : classifySlideElement(el));
      const { keyframes, easing } = buildAnimationKeyframes(resolved, distance);

      return el.animate(keyframes, {
        duration,
        delay: index * effectiveStagger,
        easing,
        fill: "both",
      });
    });

    return () => {
      animations.forEach((animation) => animation.cancel());
    };
  }, [
    contentRef,
    slideContent,
    rootImageAnimation,
    isActive,
    isPresenting,
    isPresentingLoading,
    level,
  ]);
}
