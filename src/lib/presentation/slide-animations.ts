import { type PresentationAnimationLevel } from "@/states/presentation-state";

/**
 * Entrance effects available for slide content. These map to the PowerPoint
 * "Entrance" family — the only category that makes sense for content appearing
 * on reveal. "auto" is not an effect; it means "follow the deck's level
 * choreography" and is represented by the absence of a per-element override.
 */
export type SlideAnimationEffect =
  | "fade"
  | "float-up"
  | "fly-in"
  | "wipe"
  | "split"
  | "zoom"
  | "grow-turn"
  | "bounce"
  | "swivel";

export type SlideAnimationDirection = "up" | "down" | "left" | "right";

/** A per-element override stored on a Plate node. Absent = auto. */
export interface SlideAnimationOverride {
  effect: SlideAnimationEffect;
  direction?: SlideAnimationDirection;
}

export type SlideElementKind = "image" | "heading" | "text" | "list";

export interface SlideAnimationEffectMeta {
  effect: SlideAnimationEffect;
  label: string;
  /** Whether a from-direction is meaningful for this effect. */
  directional: boolean;
}

/** Curated entrance effects shown in the picker, in display order. */
export const SLIDE_ANIMATION_EFFECTS: SlideAnimationEffectMeta[] = [
  { effect: "fade", label: "Fade", directional: false },
  { effect: "float-up", label: "Float Up", directional: false },
  { effect: "fly-in", label: "Fly In", directional: true },
  { effect: "wipe", label: "Wipe", directional: true },
  { effect: "split", label: "Split", directional: false },
  { effect: "zoom", label: "Zoom", directional: false },
  { effect: "grow-turn", label: "Grow & Turn", directional: false },
  { effect: "bounce", label: "Bounce", directional: false },
  { effect: "swivel", label: "Swivel", directional: false },
];

interface LevelTiming {
  duration: number;
  stagger: number;
  distance: number;
}

const LEVEL_TIMING: Record<
  Exclude<PresentationAnimationLevel, "off">,
  LevelTiming
> = {
  subtle: { duration: 300, stagger: 45, distance: 10 },
  balanced: { duration: 480, stagger: 90, distance: 22 },
  dynamic: { duration: 640, stagger: 130, distance: 44 },
};

export function getLevelTiming(
  level: Exclude<PresentationAnimationLevel, "off">,
): LevelTiming {
  return LEVEL_TIMING[level];
}

/**
 * The default choreography: which effect each element kind gets at each level.
 * Subtle keeps everything to a quiet fade; balanced adds gentle motion; dynamic
 * gives the varied "PowerPoint" feel (images zoom, headings/text wipe, bullets
 * fly in).
 */
export function autoEffectFor(
  level: Exclude<PresentationAnimationLevel, "off">,
  kind: SlideElementKind,
): SlideAnimationOverride {
  if (level === "subtle") {
    return { effect: "fade" };
  }

  if (level === "balanced") {
    switch (kind) {
      case "image":
        return { effect: "fade" };
      case "heading":
        return { effect: "float-up" };
      case "list":
        return { effect: "float-up" };
      case "text":
      default:
        return { effect: "fade" };
    }
  }

  // dynamic
  switch (kind) {
    case "image":
      return { effect: "zoom" };
    case "heading":
      return { effect: "wipe", direction: "left" };
    case "list":
      return { effect: "fly-in", direction: "left" };
    case "text":
    default:
      return { effect: "wipe", direction: "left" };
  }
}

/** Classify a rendered leaf element by its Plate type / tag. */
export function classifySlideElement(el: HTMLElement): SlideElementKind {
  const type = (el.getAttribute("data-slate-type") ?? "").toLowerCase();
  const tag = el.tagName.toLowerCase();

  if (el.querySelector("img") || tag === "img" || type.includes("img"))
    return "image";
  if (/^h[1-6]$/.test(tag) || /(heading|title)/.test(type) || /^h[1-6]$/.test(type))
    return "heading";
  if (tag === "li" || type.includes("bullet") || type.includes("list-item"))
    return "list";
  return "text";
}

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_BOUNCE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * Build Web Animations API keyframes for an effect. Shared by the runtime
 * engine and the picker's hover previews so they always match.
 */
export function buildAnimationKeyframes(
  override: SlideAnimationOverride,
  distance: number,
): { keyframes: Keyframe[]; easing: string } {
  const dir = override.direction ?? "left";

  switch (override.effect) {
    case "fade":
      return { keyframes: [{ opacity: 0 }, { opacity: 1 }], easing: EASE_OUT };

    case "float-up":
      return {
        keyframes: [
          { opacity: 0, transform: `translateY(${distance}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        easing: EASE_OUT,
      };

    case "fly-in": {
      const far = distance * 2.5;
      const from =
        dir === "left"
          ? `translateX(${-far}px)`
          : dir === "right"
            ? `translateX(${far}px)`
            : dir === "down"
              ? `translateY(${far}px)`
              : `translateY(${-far}px)`;
      return {
        keyframes: [
          { opacity: 0, transform: from },
          { opacity: 1, transform: "translate(0,0)" },
        ],
        easing: EASE_OUT,
      };
    }

    case "wipe": {
      const from =
        dir === "left"
          ? "inset(0 100% 0 0)"
          : dir === "right"
            ? "inset(0 0 0 100%)"
            : dir === "up"
              ? "inset(100% 0 0 0)"
              : "inset(0 0 100% 0)";
      return {
        keyframes: [
          { clipPath: from, opacity: 1 },
          { clipPath: "inset(0 0 0 0)", opacity: 1 },
        ],
        easing: EASE_OUT,
      };
    }

    case "split":
      return {
        keyframes: [
          { clipPath: "inset(0 50% 0 50%)", opacity: 1 },
          { clipPath: "inset(0 0 0 0)", opacity: 1 },
        ],
        easing: EASE_OUT,
      };

    case "zoom":
      return {
        keyframes: [
          { opacity: 0, transform: "scale(0.85)" },
          { opacity: 1, transform: "scale(1)" },
        ],
        easing: EASE_OUT,
      };

    case "grow-turn":
      return {
        keyframes: [
          { opacity: 0, transform: "scale(0.8) rotate(-8deg)" },
          { opacity: 1, transform: "scale(1) rotate(0deg)" },
        ],
        easing: EASE_OUT,
      };

    case "bounce":
      return {
        keyframes: [
          { opacity: 0, transform: `translateY(${distance}px)`, offset: 0 },
          { opacity: 1, transform: `translateY(${-distance * 0.25}px)`, offset: 0.6 },
          { transform: "translateY(0)", offset: 1 },
        ],
        easing: EASE_BOUNCE,
      };

    case "swivel":
      return {
        keyframes: [
          { opacity: 0, transform: "perspective(800px) rotateY(90deg)" },
          { opacity: 1, transform: "perspective(800px) rotateY(0deg)" },
        ],
        easing: EASE_OUT,
      };

    default:
      return { keyframes: [{ opacity: 0 }, { opacity: 1 }], easing: EASE_OUT };
  }
}
