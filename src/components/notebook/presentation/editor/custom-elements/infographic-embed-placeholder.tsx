"use client";

import { Edit3, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InfographicEmbedPlaceholderProps {
  className?: string;
  onEdit: () => void;
}

export function InfographicEmbedPlaceholder({
  className,
  onEdit,
}: InfographicEmbedPlaceholderProps) {
  return (
    <div
      className={cn(
        "group relative size-full overflow-hidden rounded-lg border border-border/50 bg-linear-to-br from-muted/40 via-background to-muted/60",
        className,
      )}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 size-16 rounded-tl-lg border border-primary/15" />
      <div className="absolute right-0 bottom-0 size-16 rounded-br-lg border border-primary/15" />

      {/* Center cross lines for visual depth */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute h-full w-px bg-linear-to-b from-transparent via-border/30 to-transparent" />
        <div className="absolute h-px w-full bg-linear-to-r from-transparent via-border/30 to-transparent" />
      </div>

      <div className="relative z-10 flex h-full min-h-50 flex-col items-center justify-center gap-5 p-6 text-center">
        {/* Icon container */}
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm transition-transform duration-300 group-hover:scale-105">
          <Sparkles className="size-5 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-foreground">
            Create an infographic
          </h3>
          <p className="max-w-xs text-sm text-muted-foreground">
            Generate a visual infographic and place it in this embed.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-colors"
          data-infographic-edit="true"
        >
          <Edit3 className="size-4" />
          Edit infographic
        </Button>
      </div>
    </div>
  );
}
