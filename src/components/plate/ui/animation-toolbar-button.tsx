"use client";

import { SparklesIcon } from "lucide-react";
import { type TElement } from "platejs";
import { useEditorRef, useEditorSelector } from "platejs/react";

import { AnimationPicker } from "@/components/presentation/animation/AnimationPicker";
import { type SlideAnimationOverride } from "@/lib/presentation/slide-animations";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";
import { ToolbarButton } from "./toolbar";

/**
 * Entrance-animation control for Plate's default text-selection (mark)
 * toolbar. Resolves the enclosing block at the current selection via
 * editor.api.block() — the same block LayoutFloatingToolbarButtons'
 * AnimationControl targets when a whole block is selected instead of a
 * text range — so either toolbar edits the same per-element override.
 */
export function AnimationToolbarButton() {
  const editor = useEditorRef();

  const block = useEditorSelector(
    (currentEditor) => currentEditor.api.block(),
    [],
  );
  const blockElement = block?.[0] as TElement | undefined;
  const value =
    (blockElement?.animation as SlideAnimationOverride | undefined) ?? null;
  const hasCustom = value !== null;

  const onChange = (next: SlideAnimationOverride | null) => {
    if (!blockElement?.id) return;
    editor.tf.setNodes(
      { animation: next ?? undefined },
      { at: [], match: (n) => n.id === blockElement.id },
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <ToolbarButton
          className={cn("gap-1.5 px-2", hasCustom && "text-primary")}
          tooltip="Entrance animation"
        >
          <SparklesIcon className="size-4" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Animation</span>
        </div>
        <AnimationPicker value={value} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
