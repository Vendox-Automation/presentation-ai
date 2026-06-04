"use client";

import { Frown, Meh, Plus, RotateCcw, Smile } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PRESENTATION_GENERATION_FEEDBACK_SOURCE } from "@/lib/feedback/metadata";
import { cn } from "@/lib/utils";

interface PresentationCompletionFeedbackProps {
  presentationId: string;
  presentationTitle: string | null;
  onHide: () => void;
}

type Reaction = "like" | "neutral" | "dislike" | null;

const UNTITLED_PRESENTATION_LABEL = "Untitled Presentation";

function buildPresentationFeedbackMessage({
  reaction,
  presentationId,
  presentationTitle,
  details,
}: {
  reaction: Exclude<Reaction, null>;
  presentationId: string;
  presentationTitle: string | null;
  details?: string;
}) {
  const trimmedDetails = details?.trim();

  return [
    `Presentation generation satisfaction: ${reaction}`,
    `Presentation ID: ${presentationId}`,
    `Presentation title: ${presentationTitle ?? UNTITLED_PRESENTATION_LABEL}`,
    trimmedDetails ? `What they did not like: ${trimmedDetails}` : null,
  ]
    .filter((value): value is string => value !== null)
    .join("\n");
}

export function PresentationCompletionFeedback({
  presentationId,
  presentationTitle,
  onHide,
}: PresentationCompletionFeedbackProps) {
  const router = useRouter();
  const { push } = router;
  const { data: session } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(null);
  const [dislikeDialogOpen, setDislikeDialogOpen] = useState(false);
  const [dislikeDetails, setDislikeDetails] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const [bgStyle, setBgStyle] = useState<{ top: number; right: number }>({
    top: 9999,
    right: 0,
  });

  useEffect(() => {
    const scrollEl = containerRef.current?.closest<HTMLElement>(
      ".presentation-slides",
    );

    const update = () => {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      // Stop background at the scrollbar's left edge, not the viewport's right edge
      const scrollbarWidth = scrollEl
        ? scrollEl.offsetWidth - scrollEl.clientWidth
        : 0;
      const distanceToViewportRight = scrollEl
        ? window.innerWidth - scrollEl.getBoundingClientRect().right
        : 0;
      const right = distanceToViewportRight + scrollbarWidth;
      setBgStyle({ top, right });
    };

    update();

    scrollEl?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      scrollEl?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const submitPresentationFeedback = async (
    nextReaction: Exclude<Reaction, null>,
    details?: string,
  ) => {
    const trimmedDetails = details?.trim();

    setIsPending(true);
    try {
      console.info("Presentation feedback", {
        type: nextReaction === "like" ? "feedback" : "suggestion",
        message: buildPresentationFeedbackMessage({
          reaction: nextReaction,
          presentationId,
          presentationTitle,
          details: trimmedDetails,
        }),
        email: session?.user?.email ?? null,
        metadata: {
          source: PRESENTATION_GENERATION_FEEDBACK_SOURCE,
          reaction: nextReaction,
          presentationId,
          presentationTitle: presentationTitle ?? UNTITLED_PRESENTATION_LABEL,
          hasDetailedFeedback: Boolean(trimmedDetails),
        },
      });
    } finally {
      setIsPending(false);
    }

    setReaction(nextReaction);
  };

  const submitDislikeFeedback = async (details?: string) => {
    await submitPresentationFeedback("dislike", details);
    setDislikeDialogOpen(false);
  };

  const handleReaction = async (nextReaction: Exclude<Reaction, null>) => {
    if (nextReaction === "dislike") {
      setDislikeDetails("");
      setDislikeDialogOpen(true);
      return;
    }

    await submitPresentationFeedback(nextReaction);
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex min-h-full w-full flex-col items-center justify-center py-12"
      >
        {/* Fixed background: inset-x-0 bottom-0, top tracks component's viewport position */}
        <div
          className="fixed right-0 bottom-0 left-0 z-1 bg-muted/40 dark:bg-card/60"
          style={{ top: bgStyle.top, right: bgStyle.right }}
        />

        {/* Content sits above the background */}
        <div className="relative z-2 flex w-full flex-col items-center">
          <div className="w-full max-w-xs rounded-xl border border-border/40 bg-muted/20 p-4 text-center">
            <p className="mb-3 text-xs text-muted-foreground/50">
              Help us to improve
            </p>
            <p className="mb-4 text-sm font-medium text-foreground">
              What is your satisfaction level with this presentation ?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReaction("dislike")}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-border/40 bg-transparent transition-colors hover:border-red-400/50 hover:bg-red-400/10",
                  reaction === "dislike" &&
                    "border-red-400 bg-red-400/10 text-red-500",
                )}
              >
                <Frown className="size-5" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReaction("neutral")}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-border/40 bg-transparent transition-colors hover:border-amber-400/50 hover:bg-amber-400/10",
                  reaction === "neutral" &&
                    "border-amber-400 bg-amber-400/10 text-amber-500",
                )}
              >
                <Meh className="size-5" />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleReaction("like")}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border border-border/40 bg-transparent transition-colors hover:border-green-400/50 hover:bg-green-400/10",
                  reaction === "like" &&
                    "border-green-400 bg-green-400/10 text-green-500",
                )}
              >
                <Smile className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
            <Button
              size="lg"
              className="w-full gap-2 rounded-full"
              onClick={() => push("/presentation/create")}
            >
              <Plus className="size-4" />
              Create a new doc
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full gap-2 rounded-full"
              onClick={() => push(`/presentation/generate/${presentationId}`)}
            >
              <RotateCcw className="size-4" />
              Back to prompt
            </Button>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="mt-3 w-full max-w-xs rounded-full"
            onClick={onHide}
          >
            Hide
          </Button>
        </div>
      </div>

      <Dialog open={dislikeDialogOpen} onOpenChange={setDislikeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form
            className="space-y-4"
            action={() => {
              void submitDislikeFeedback(dislikeDetails);
            }}
          >
            <DialogHeader>
              <DialogTitle>Tell us what you did not like</DialogTitle>
              <DialogDescription>
                This is optional. You can skip it and we will still record your
                dislike.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              value={dislikeDetails}
              onChange={(event) => setDislikeDetails(event.target.value)}
              placeholder="Share what felt wrong, missing, or low quality about this presentation generation."
              className="min-h-32 resize-none"
            />

            <Button type="submit" disabled={isPending} className="w-full">
              Send feedback
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
