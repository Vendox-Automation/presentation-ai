"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  buildAnimationKeyframes,
  SLIDE_ANIMATION_EFFECTS,
  type SlideAnimationDirection,
  type SlideAnimationEffect,
  type SlideAnimationOverride,
} from "@/lib/presentation/slide-animations";
import { cn } from "@/lib/utils";

const DIRECTIONS: { value: SlideAnimationDirection; icon: React.ReactNode }[] = [
  { value: "left", icon: <ArrowRight className="size-3.5" /> },
  { value: "right", icon: <ArrowLeft className="size-3.5" /> },
  { value: "up", icon: <ArrowDown className="size-3.5" /> },
  { value: "down", icon: <ArrowUp className="size-3.5" /> },
];

const DIRECTION_LABEL: Record<SlideAnimationDirection, string> = {
  left: "From left",
  right: "From right",
  up: "From top",
  down: "From bottom",
};

/** A tile that plays its effect on the inner shape when hovered. */
function EffectTile({
  effect,
  label,
  direction,
  selected,
  onSelect,
}: {
  effect: SlideAnimationEffect;
  label: string;
  direction: SlideAnimationDirection | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const shapeRef = useRef<HTMLDivElement>(null);

  const play = () => {
    const node = shapeRef.current;
    if (!node) return;
    const { keyframes, easing } = buildAnimationKeyframes(
      { effect, direction },
      14,
    );
    node.getAnimations().forEach((a) => a.cancel());
    node.animate(keyframes, { duration: 520, easing, fill: "both" });
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={play}
      onFocus={play}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <div className="flex h-8 w-full items-center justify-center overflow-hidden rounded bg-muted/60">
        <div
          ref={shapeRef}
          className="h-2.5 w-8 rounded-sm bg-primary"
          style={{ willChange: "transform, opacity, clip-path" }}
        />
      </div>
      <span className="text-[11px] leading-none text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

interface AnimationPickerProps {
  /** Current override, or null when the element follows the deck's auto choreography. */
  value: SlideAnimationOverride | null;
  onChange: (value: SlideAnimationOverride | null) => void;
  /** Optional: replay the effect on the actual element in the canvas. */
  onPreview?: () => void;
}

export function AnimationPicker({
  value,
  onChange,
  onPreview,
}: AnimationPickerProps) {
  const activeEffect = value?.effect ?? null;
  const activeMeta = SLIDE_ANIMATION_EFFECTS.find(
    (e) => e.effect === activeEffect,
  );
  const direction = value?.direction ?? "left";

  return (
    <div className="space-y-3">
      {/* Auto (default) */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border p-2.5 text-left transition-colors",
          value === null
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <span className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Sparkles className="size-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-medium">Auto</span>
          <span className="text-xs text-muted-foreground">
            Follows the deck&apos;s animation level
          </span>
        </span>
      </button>

      <div className="grid grid-cols-3 gap-2">
        {SLIDE_ANIMATION_EFFECTS.map((meta) => (
          <EffectTile
            key={meta.effect}
            effect={meta.effect}
            label={meta.label}
            direction={meta.directional ? direction : undefined}
            selected={activeEffect === meta.effect}
            onSelect={() =>
              onChange({
                effect: meta.effect,
                ...(meta.directional ? { direction } : {}),
              })
            }
          />
        ))}
      </div>

      {/* Direction control for directional effects */}
      {activeMeta?.directional && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {DIRECTION_LABEL[direction]}
          </span>
          <div className="flex gap-1.5">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() =>
                  onChange({ effect: activeMeta.effect, direction: d.value })
                }
                className={cn(
                  "flex flex-1 items-center justify-center rounded-md border p-1.5 transition-colors",
                  direction === d.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/50",
                )}
                aria-label={DIRECTION_LABEL[d.value]}
              >
                {d.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {onPreview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onPreview}
        >
          Preview on slide
        </Button>
      )}
    </div>
  );
}
