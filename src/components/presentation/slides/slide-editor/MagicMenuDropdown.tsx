"use client";

import {
  ArrowDown,
  ArrowRight,
  Check,
  Globe,
  ImageIcon,
  PenTool,
  Plus,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { PRESENTATION_PORTAL_CONTENT_CLASS } from "@/components/presentation/overlay-layers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useSlideEditorContext } from "./SlideEditorContext";

const makeVisualAction: MagicAction = {
  icon: ImageIcon,
  label: "Make visual",
  prompt:
    "Redesign this card to be more visual and presentation-ready. Convert dense text into a stronger visual hierarchy while preserving the meaning.",
};

interface MagicAction {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

export function MagicMenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const language = usePresentationState((s) => s.language);
  const {
    aiInput,
    setAiInput,
    handleAiSubmit,
    handleAiKeyDown,
    handleImageEdit,
    handleMagicPrompt,
  } = useSlideEditorContext();

  const runMagicAction = (prompt: string) => {
    handleMagicPrompt(prompt);
    setIsOpen(false);
  };

  const writingActions: MagicAction[] = [
    {
      icon: PenTool,
      label: "Improve writing",
      prompt:
        "Improve the writing on this card. Make it sharper, clearer, and more executive-ready while preserving the original meaning.",
    },
    {
      icon: Check,
      label: "Fix spelling",
      prompt:
        "Fix spelling, grammar, punctuation, and awkward phrasing on this card without changing the meaning or layout.",
    },
    {
      icon: Globe,
      label: "Translate",
      prompt: `Translate this card into the presentation language (${language}). Preserve the slide structure and meaning.`,
    },
    {
      icon: ArrowDown,
      label: "Simplify",
      prompt:
        "Simplify this card. Use shorter sentences and clearer wording while keeping the same core points.",
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8! gap-1 rounded-full border border-white/20 bg-background/50 shadow backdrop-blur-md transition-all hover:border-primary/40 hover:bg-background/90 hover:text-primary"
        >
          <Sparkles className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          PRESENTATION_PORTAL_CONTENT_CLASS,
          "w-86 overflow-hidden rounded-xl border-border/70 bg-neutral-950 p-0 text-neutral-50 shadow-2xl",
        )}
      >
        <div className="border-b border-white/10 bg-linear-to-b from-white/10 to-transparent p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-3.5" />
            </div>
            <h3 className="text-sm font-semibold">Edit this card</h3>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/6 p-2 shadow-inner transition-colors focus-within:border-primary/70">
            <input
              aria-label="magic menu dropdown control"
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={handleAiKeyDown}
              placeholder="How would you like to edit this card?"
              className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-neutral-500"
            />
            <button
              type="button"
              onClick={() => {
                handleAiSubmit();
                if (aiInput.trim()) {
                  setIsOpen(false);
                }
              }}
              disabled={!aiInput.trim()}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-neutral-600"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() =>
              runMagicAction(
                "Try a new layout for this card. Keep the same message, but improve the visual balance, hierarchy, and slide structure.",
              )
            }
            className="mb-3 flex w-full items-center justify-between rounded-lg border border-primary/25 bg-primary/10 px-3 py-2.5 text-left transition hover:border-primary/50 hover:bg-primary/20"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" />
              Try new layout
            </span>
            <ArrowRight className="size-4 text-neutral-500" />
          </button>

          <DropdownMenuSeparator className="bg-white/10" />

          <div className="mt-3 mb-4">
            <h4 className="mb-2 px-1 text-[0.68rem] font-semibold text-neutral-500 uppercase">
              Writing
            </h4>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {writingActions.map((action) => (
                <MagicActionButton
                  key={action.label}
                  action={action}
                  onClick={() => runMagicAction(action.prompt)}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 px-1 text-[0.68rem] font-semibold text-neutral-500 uppercase">
              Image
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <MagicActionButton
                action={makeVisualAction}
                onClick={() => runMagicAction(makeVisualAction.prompt)}
              />
              <button
                type="button"
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-left text-sm font-medium text-neutral-100 transition",
                  "hover:border-primary/50 hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:outline-none",
                )}
                onClick={() => {
                  handleImageEdit();
                  setIsOpen(false);
                }}
              >
                <Plus className="size-4" />
                Add image
              </button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MagicActionButton({
  action,
  onClick,
}: {
  action: MagicAction;
  onClick: () => void;
}) {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-left text-sm font-medium text-neutral-100 transition",
        "hover:border-primary/50 hover:bg-white/12 hover:text-white focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:outline-none",
      )}
    >
      <Icon className="size-4 shrink-0 text-neutral-400" />
      <span className="min-w-0 leading-tight">{action.label}</span>
    </button>
  );
}
