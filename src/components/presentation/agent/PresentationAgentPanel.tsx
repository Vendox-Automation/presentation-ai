"use client";

import { Bot, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";

export function PresentationAgentPanel() {
  const setActiveRightPanel = usePresentationState(
    (state) => state.setActiveRightPanel,
  );

  return (
    <div className="flex h-full w-104 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <h2 className="text-sm font-semibold tracking-wide">Agent</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveRightPanel(null)}
          className="h-8 w-8 hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Presentation agent chat is not part of this extracted build.
      </div>
    </div>
  );
}
