"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Settings2, Star } from "lucide-react";
import type React from "react";
import { useEffect, useState, useTransition, type KeyboardEvent } from "react";

import { toggleFavoriteTheme } from "@/app/_actions/presentation/theme-favorite-actions";
import { toggleLikeTheme } from "@/app/_actions/presentation/theme-like-actions";
import { isBuiltInPresentationTheme } from "@/lib/presentation/theme-resolution";
import { type ThemeProperties } from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { openThemeCustomizer } from "./customize-theme";
import { useThemePanelState } from "./theme-panel-state";

interface ThemeCardProps {
  themeId: string;
  theme: ThemeProperties;
  isSelected: boolean;
  isFavorite?: boolean;
  likeCount?: number;
  isLiked?: boolean;
  showLikeButton?: boolean;
  showFavoriteButton?: boolean;
  showEllipsis?: boolean;
  showInfo?: boolean;
  personalizeLabel?: string;
  onSelect?: (id: string) => void;
  isFocused?: boolean;
  isOwner?: boolean;
  isPublic?: boolean;
  isAdminTheme?: boolean;
  canEditSystemTheme?: boolean;
  refCallback?: (node: HTMLDivElement | null) => void;
  tabIndex?: number;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function ThemeCard({
  themeId,
  theme,
  isSelected,
  isFavorite,
  likeCount = 0,
  isLiked = false,
  showLikeButton = false,
  showFavoriteButton = true,
  showEllipsis = true,
  showInfo = true,
  personalizeLabel,
  onSelect,
  isFocused = false,
  isOwner = false,
  isPublic = false,
  isAdminTheme = false,
  canEditSystemTheme = false,
  refCallback,
  tabIndex = 0,
  onFocus,
  onKeyDown,
  onKeyUp,
}: ThemeCardProps) {
  const {
    openEditMenu,
    setOpenEditMenu,
    setEditingTheme,
    setOpenCreateThemeModal,
    setIsCustomizing,
  } = useThemePanelState();
  const identifier = themeId;
  const showEditMenu = openEditMenu === identifier;
  const [isPendingFavorite, startFavoriteTransition] = useTransition();
  const [isPendingLike, startLikeTransition] = useTransition();
  const [localIsFavorite, setLocalIsFavorite] = useState(isFavorite ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);

  const queryClient = useQueryClient();
  const invalidateFavorites = () => {
    queryClient.invalidateQueries({
      queryKey: ["presentation", "themes", "favorites"],
    });
    queryClient.invalidateQueries({
      queryKey: ["presentation", "themes", "public"],
    });
  };

  const invalidateLikes = () => {
    queryClient.invalidateQueries({
      queryKey: ["presentation", "themes", "public"],
    });
    queryClient.invalidateQueries({
      queryKey: ["presentation", "themes", "favorites"],
    });
  };

  useEffect(() => {
    setLocalIsFavorite(isFavorite ?? false);
  }, [isFavorite]);

  useEffect(() => {
    setLocalLikeCount(likeCount);
  }, [likeCount]);

  useEffect(() => {
    setLocalIsLiked(isLiked);
  }, [isLiked]);

  // Font pairing display
  const fontPairing = `${theme.fonts.heading} / ${theme.fonts.body}`;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!themeId) {
      return;
    }

    startFavoriteTransition(async () => {
      // Optimistic update
      const previous = localIsFavorite;
      const optimistic = !previous;
      setLocalIsFavorite(optimistic);

      try {
        const result = await toggleFavoriteTheme(themeId);
        if (result.success) {
          // Align with server response if it differs
          if (result.isFavorite !== undefined) {
            setLocalIsFavorite(result.isFavorite);
          }
          invalidateFavorites();
        } else {
          // Roll back on failure
          setLocalIsFavorite(previous);
        }
      } catch {
        setLocalIsFavorite(previous);
      }
    });
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!themeId) {
      return;
    }

    startLikeTransition(async () => {
      // Optimistic update: flip like and adjust count
      const prevLiked = localIsLiked;
      const prevCount = localLikeCount;
      const optimisticLiked = !prevLiked;
      const optimisticCount = prevCount + (optimisticLiked ? 1 : -1);

      setLocalIsLiked(optimisticLiked);
      setLocalLikeCount(Math.max(0, optimisticCount));

      try {
        const result = await toggleLikeTheme(themeId);
        if (result.success) {
          // Align to server if different
          if (typeof result.isLiked === "boolean") {
            setLocalIsLiked(result.isLiked);
          }
          if (typeof result.likeCount === "number") {
            setLocalLikeCount(result.likeCount);
          }
          invalidateLikes?.();
        } else {
          // Roll back on failure
          setLocalIsLiked(prevLiked);
          setLocalLikeCount(prevCount);
        }
      } catch {
        setLocalIsLiked(prevLiked);
        setLocalLikeCount(prevCount);
      }
    });
  };

  const handleEditMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenEditMenu(showEditMenu ? null : identifier);
  };

  // Only show ellipsis if user is owner
  const canEdit = isOwner || (isAdminTheme && canEditSystemTheme);
  // Only show delete if user is owner AND theme is private
  const canDelete = isOwner && !isPublic;
  const shouldShowPersonalizeButton = isSelected && personalizeLabel;

  // Use local state for display
  const isVisuallyActive = isSelected || isFocused;

  const handlePersonalizeClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOwner && !isAdminTheme) {
      setEditingTheme({
        id: themeId,
        name: theme.name,
        description: theme.description ?? null,
        themeData: theme,
        isPublic,
        isAdmin: false,
        logoUrl: null,
        userId: "",
      });
      setIsCustomizing(false);
      setOpenCreateThemeModal(true);
      setOpenEditMenu(null);
      return;
    }

    openThemeCustomizer();
  };

  return (
    <div
      className={cn(
        "relative size-full min-w-0 overflow-hidden rounded-lg border-2 transition-all",
        isVisuallyActive
          ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary)/0.35),0_10px_24px_hsl(var(--primary)/0.14)]"
          : "border-border/70 hover:border-primary/50",
      )}
    >
      {/* Action buttons in top right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {themeId && showFavoriteButton && (
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isPendingFavorite}
            className="rounded-full bg-background/80 p-1 transition-colors hover:bg-background disabled:opacity-50"
          >
            <Star
              className={cn(
                "size-3.5",
                localIsFavorite
                  ? "fill-yellow-500 text-yellow-500"
                  : "text-muted-foreground",
              )}
            />
          </button>
        )}

        {showEllipsis && canEdit && (
          <div className="relative">
            <button
              aria-label="theme card control"
              type="button"
              onClick={handleEditMenuToggle}
              className="rounded-full bg-background/80 p-1 transition-colors hover:bg-background"
            >
              <svg
                className="size-3.5 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {showEditMenu && (
              <div className="absolute top-full right-0 z-20 mt-1 w-28 rounded-lg border border-border bg-background py-1 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTheme({
                      id: themeId,
                      name: theme.name,
                      description: theme.description ?? null,
                      themeData: theme,
                      isPublic: isPublic,
                      isAdmin: isAdminTheme,
                      logoUrl: null,
                      userId: "",
                    });
                    setOpenCreateThemeModal(true);
                    setOpenEditMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                >
                  Edit Theme
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-muted"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={refCallback}
        role="button"
        aria-pressed={isSelected}
        data-panel-arrow-target="true"
        tabIndex={tabIndex}
        onClick={() => {
          if (onSelect) {
            onSelect(themeId);
            return;
          }
          usePresentationState
            .getState()
            .setTheme(
              themeId,
              isBuiltInPresentationTheme(themeId) ? undefined : theme,
            );
        }}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        className={cn(
          "size-full rounded-md transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          isVisuallyActive ? "bg-primary/5" : "hover:bg-primary/5",
        )}
      >
        {/* Like button for public themes */}
        {showLikeButton && themeId && (
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isPendingLike}
            className={cn(
              "absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-background/95 disabled:opacity-50",
              localIsLiked && "bg-red-50 dark:bg-red-950/30",
            )}
          >
            <svg
              className={cn(
                "size-3",
                localIsLiked
                  ? "fill-red-500 text-red-500"
                  : "fill-transparent stroke-red-500 text-red-500",
              )}
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-xs text-foreground">{localLikeCount}</span>
          </button>
        )}

        {/* Theme preview */}
        <div className="relative h-28 w-full overflow-hidden rounded-t-lg sm:h-32">
          {/* Page background - uses theme.background.override */}
          <div
            className="absolute inset-0 p-2.5 sm:p-3"
            style={{
              background: theme.colors.primary,
              // background: theme.background?.override || theme.colors.background ,
            }}
          >
            {/* Slide background - uses theme.colors.background */}
            <div
              className="flex size-full flex-col items-center justify-center p-3"
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.card,
                boxShadow: theme.shadows.card,
                border: `1px solid ${theme.colors.primary}60`,
              }}
            >
              {/* Title with heading color */}
              <h3
                className="mb-1 text-center text-sm font-bold sm:text-base"
                style={{ color: theme.colors.heading }}
              >
                Title
              </h3>
              {/* Body text with text color */}
              <p
                className="mb-2 text-center text-[11px] sm:text-xs"
                style={{ color: theme.colors.text }}
              >
                Body text{" "}
                <span
                  className="underline"
                  style={{ color: theme.colors.accent }}
                >
                  Link
                </span>
              </p>
              {/* Smart layout color bar */}
              <div
                className="h-1.5 w-12 rounded-full"
                style={{ backgroundColor: theme.colors.smartLayout }}
                title="Smart Layout"
              />
            </div>
            {shouldShowPersonalizeButton && (
              <button
                onClick={handlePersonalizeClick}
                className="absolute right-0.5 bottom-0.5 z-10 flex h-7 items-center gap-1.5 rounded-full bg-purple-600 px-2.5 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
                type="button"
              >
                <Settings2 className="size-3" />
                <span>{personalizeLabel}</span>
              </button>
            )}
          </div>
        </div>

        {/* Theme info */}
        {showInfo && (
          <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex min-w-0 flex-col items-start gap-0.5">
              <span className="text-left text-xs font-medium text-foreground">
                {theme.name}
              </span>
              <span className="line-clamp-1 text-left text-xs text-muted-foreground">
                {fontPairing.trim()}
              </span>
            </div>
            {isSelected && (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-600">
                <svg
                  className="size-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
