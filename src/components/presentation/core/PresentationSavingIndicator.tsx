"use client";

import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { usePresentationState } from "@/states/presentation-state";

export function PresentationSavingIndicator() {
  const savingStatus = usePresentationState((s) => s.savingStatus);
  const isReadOnly = usePresentationState((s) => s.isReadOnly);

  const [visibleStatus, setVisibleStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (savingStatus === "saving") {
      setVisibleStatus("saving");
    } else if (savingStatus === "saved") {
      setVisibleStatus("saved");
      timeout = setTimeout(() => {
        setVisibleStatus("idle");
      }, 2000);
    } else if (savingStatus === "idle") {
      setVisibleStatus("idle");
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [savingStatus]);

  if (isReadOnly || visibleStatus === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 px-2 text-sm text-muted-foreground">
      {visibleStatus === "saving" && (
        <>
          <Loader2 className="size-3.5" />
          <span className="hidden sm:inline">
            Saving…
          </span>
        </>
      )}
      {visibleStatus === "saved" && (
        <>
          <CheckCircle className="size-3.5 text-green-600" />
          <span className="hidden text-green-600 sm:inline">
            Saved
          </span>
        </>
      )}
    </div>
  );
}
