"use client";

import { Sparkles } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { cn } from "@/lib/utils";
import {
  type PresentationAnimationLevel,
  usePresentationState,
} from "@/states/presentation-state";

const LEVELS: { value: Exclude<PresentationAnimationLevel, "off">; label: string }[] =
  [
    { value: "subtle", label: "Subtle" },
    { value: "balanced", label: "Balanced" },
    { value: "dynamic", label: "Dynamic" },
  ];

// The level a fresh "on" toggle lands on.
const DEFAULT_ON_LEVEL: PresentationAnimationLevel = "balanced";

export function AnimationsSection() {
  const animationLevel = usePresentationState((s) => s.animationLevel);
  const setAnimationLevel = usePresentationState((s) => s.setAnimationLevel);
  const { save } = useDebouncedSave({ delay: 400 });

  const isOn = animationLevel !== "off";

  const applyLevel = (level: PresentationAnimationLevel) => {
    setAnimationLevel(level);
    // Persist promptly — the slide-change autosave won't fire for a settings-only change.
    save();
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-semibold">
        <Sparkles className="size-4 text-muted-foreground" />
        Animations
      </Label>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex flex-col">
          <span className="text-sm">Enable animations</span>
          <span className="text-xs text-muted-foreground">
            Content animates in as each slide appears while presenting.
          </span>
        </div>
        <Switch
          checked={isOn}
          onCheckedChange={(checked) =>
            applyLevel(checked ? DEFAULT_ON_LEVEL : "off")
          }
          aria-label="Enable animations"
        />
      </div>

      {isOn && (
        <ToggleGroup
          type="single"
          value={animationLevel}
          onValueChange={(val) =>
            val && applyLevel(val as PresentationAnimationLevel)
          }
          className="w-full gap-2 rounded-full"
        >
          {LEVELS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              variant="outline"
              size="sm"
              className={cn(
                "flex-1 border-border transition-all",
                animationLevel === value &&
                  "border-primary bg-primary text-primary-foreground",
              )}
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
}
