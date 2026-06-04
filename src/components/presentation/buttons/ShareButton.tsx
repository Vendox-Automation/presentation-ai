"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePresentationState } from "@/states/presentation-state";

export function ShareButton() {
    const currentPresentationId = usePresentationState(
    (state) => state.currentPresentationId,
  );
  const shareUrl = currentPresentationId
    ? `${window.location.origin}/share/presentation/${currentPresentationId}`
    : "";

  const copyShareLink = async () => {
    if (!shareUrl) {
      return;
    }

    await navigator.clipboard.writeText(shareUrl);
    toast.success("Presentation link copied");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={!currentPresentationId}
      onClick={() => void copyShareLink()}
      aria-label={"Copy presentation link"}
    >
      <Share2 className="size-4" />
    </Button>
  );
}
