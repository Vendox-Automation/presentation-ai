"use client";

import { Sparkles } from "lucide-react";

import { AnimationPicker } from "@/components/presentation/animation/AnimationPicker";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type SlideAnimationOverride } from "@/lib/presentation/slide-animations";
import { cn } from "@/lib/utils";
import { useToolbarContext } from "./ToolbarContext";

export function AnimationControl() {
  const { element, handleNodePropertyUpdate } = useToolbarContext();

  const value =
    (element?.animation as SlideAnimationOverride | undefined) ?? null;
  const hasCustom = value !== null;

  const onChange = (next: SlideAnimationOverride | null) => {
    // undefined clears the override so the element falls back to auto.
    handleNodePropertyUpdate(
      "animation",
      next ? ({ ...next } as Record<string, unknown>) : undefined,
    );
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2",
                hasCustom && "text-primary",
              )}
            >
              <Sparkles className="size-4" />
              <span className="text-xs">Animate</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Entrance animation</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Animation</span>
        </div>
        <AnimationPicker value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
