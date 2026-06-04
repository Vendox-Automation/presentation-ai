"use client";

import { Star, X } from "lucide-react";

import { CreateThemeModal } from "@/components/notebook/presentation/components/theme/create-theme/CreateThemeModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { useThemePanelState } from "./theme-panel-state";

export function ThemePanelHeader() {
  const { showFavorites, setShowFavorites, setOpenCreateThemeModal } =
    useThemePanelState();
  const setActiveRightPanel = usePresentationState(
    (s) => s.setActiveRightPanel,
  );

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2">
      <Button
        onClick={() => setOpenCreateThemeModal(true)}
        className="bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
      >
        New Theme
      </Button>
      <div className="flex items-center gap-2">
        <CreateThemeModal />
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "size-8! rounded-full p-0",
            showFavorites
              ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400"
              : "text-foreground",
          )}
          onClick={() => setShowFavorites(!showFavorites)}
          aria-pressed={showFavorites}
          aria-label="Favorite themes"
          title="Favorite themes"
        >
          <Star
            className={cn(
              "size-4!",
              showFavorites && "fill-yellow-500 text-yellow-500",
            )}
          />
        </Button>
        <Button
          variant="ghost"
          className="size-8! rounded-full p-0"
          onClick={() => setActiveRightPanel(null)}
        >
          <X className="size-5!" />
        </Button>
      </div>
    </div>
  );
}
