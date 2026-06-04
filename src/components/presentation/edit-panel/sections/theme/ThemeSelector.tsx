"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { isBuiltInPresentationTheme } from "@/lib/presentation/theme-resolution";
import { type ThemeProperties } from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { ThemeCard } from "./ThemeCard";

const KEYBOARD_APPLY_DELAY_MS = 100;
const THEME_GRID_COLUMNS = 2;

export interface ThemeListItem {
  theme: ThemeProperties;
  themeId: string;
  isFavorite?: boolean;
  likeCount?: number;
  isLiked?: boolean;
  canLike?: boolean;
  showFavoriteButton?: boolean;
  isUserTheme?: boolean;
  isAdminTheme?: boolean;
  canEditSystemTheme?: boolean;
}

interface ThemeSelectorProps {
  themes: ThemeListItem[];
  activeKey: string;
  isLoading?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
}

export function ThemeSelector({
  themes,
  activeKey,
  isLoading = false,
  emptyMessage = "No themes available.",
  skeletonCount = 6,
}: ThemeSelectorProps) {
  const { userThemes, otherThemes, orderedThemes } = useMemo(() => {
    const ownedThemes = themes.filter((item) => item.isUserTheme);
    const sharedThemes = themes.filter((item) => !item.isUserTheme);

    return {
      userThemes: ownedThemes,
      otherThemes: sharedThemes,
      orderedThemes: [...ownedThemes, ...sharedThemes],
    };
  }, [themes]);
  const hasUserThemes = userThemes.length > 0;
  const hasOtherThemes = otherThemes.length > 0;
  const activeThemeIndex = orderedThemes.findIndex(
    (item) => item.themeId === activeKey,
  );
  const initialSelectedIndex = activeThemeIndex >= 0 ? activeThemeIndex : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    initialSelectedIndex,
  );
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeKeyRef = useRef(activeKey);
  const pendingKeyboardIndexRef = useRef<number | null>(null);

  useEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  const focusCard = useCallback((index: number) => {
    cardRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(initialSelectedIndex);

    if (initialSelectedIndex === null) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      focusCard(initialSelectedIndex);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [focusCard, initialSelectedIndex]);

  useEffect(
    () => () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    },
    [],
  );

  const commitSelection = useCallback(
    (index: number) => {
      const item = orderedThemes[index];

      if (!item) return;
      if (item.themeId === activeKeyRef.current) return;

      activeKeyRef.current = item.themeId;
      usePresentationState
        .getState()
        .setTheme(
          item.themeId,
          isBuiltInPresentationTheme(item.themeId) ? undefined : item.theme,
        );
    },
    [orderedThemes],
  );

  const selectItem = useCallback(
    (index: number) => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }

      pendingKeyboardIndexRef.current = null;
      setSelectedIndex(index);
      commitSelection(index);
    },
    [commitSelection],
  );

  const schedulePendingKeyboardCommit = useCallback(() => {
    if (pendingKeyboardIndexRef.current === null) return;

    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
    }

    applyTimeoutRef.current = setTimeout(() => {
      const pendingIndex = pendingKeyboardIndexRef.current;
      applyTimeoutRef.current = null;
      pendingKeyboardIndexRef.current = null;

      if (pendingIndex === null) return;

      commitSelection(pendingIndex);
    }, KEYBOARD_APPLY_DELAY_MS);
  }, [commitSelection]);

  const moveSelection = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.min(
        Math.max(nextIndex, 0),
        orderedThemes.length - 1,
      );

      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }

      pendingKeyboardIndexRef.current = boundedIndex;
      setSelectedIndex(boundedIndex);
      focusCard(boundedIndex);
    },
    [focusCard, orderedThemes.length],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index - THEME_GRID_COLUMNS);
          break;
        case "ArrowDown":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index + THEME_GRID_COLUMNS);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(orderedThemes.length - 1);
          break;
      }
    },
    [moveSelection, orderedThemes.length],
  );

  const handleCardKeyUp = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
        case "Home":
        case "End":
          event.preventDefault();
          event.stopPropagation();
          schedulePendingKeyboardCommit();
          break;
      }
    },
    [schedulePendingKeyboardCommit],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-4 pt-3">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ThemeCardSkeleton key={`theme-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (!themes.length) {
    return (
      <div className="mx-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="scrollbar-thin max-h-[calc(100vh-64px-2*80px)] overflow-y-auto scrollbar-thumb-primary scrollbar-track-transparent">
      {hasUserThemes && (
        <div className="px-4 pt-3">
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            My Themes
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {userThemes.map((item, index) => (
              <ThemeCard
                key={item.themeId}
                themeId={item.themeId}
                theme={item.theme}
                isSelected={activeKey === item.themeId}
                isFavorite={item.isFavorite}
                likeCount={item.likeCount}
                isLiked={item.isLiked}
                showLikeButton={item.canLike ?? false}
                showFavoriteButton={item.showFavoriteButton}
                personalizeLabel="Personlize"
                isOwner={item.isUserTheme}
                isPublic={false}
                isAdminTheme={item.isAdminTheme}
                canEditSystemTheme={item.canEditSystemTheme}
                isFocused={selectedIndex === index}
                refCallback={(node) => {
                  cardRefs.current[index] = node;
                }}
                tabIndex={selectedIndex === index ? 0 : -1}
                onSelect={() => selectItem(index)}
                onFocus={() => setSelectedIndex(index)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
                onKeyUp={handleCardKeyUp}
              />
            ))}
          </div>
        </div>
      )}

      {hasOtherThemes && (
        <div className={`px-4 ${hasUserThemes ? "pt-6" : "pt-3"}`}>
          {hasUserThemes && (
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              ALLWEONE Themes
            </h3>
          )}
          <div className="grid grid-cols-2 gap-3">
            {otherThemes.map((item, publicIndex) => {
              const index = userThemes.length + publicIndex;

              return (
                <ThemeCard
                  key={item.themeId}
                  themeId={item.themeId}
                  theme={item.theme}
                  isSelected={activeKey === item.themeId}
                  isFavorite={item.isFavorite}
                  likeCount={item.likeCount}
                  isLiked={item.isLiked}
                  showLikeButton={item.canLike ?? false}
                  showFavoriteButton={item.showFavoriteButton}
                  personalizeLabel="Personlize"
                  isOwner={item.isUserTheme}
                  isPublic={!item.isUserTheme}
                  isAdminTheme={item.isAdminTheme}
                  canEditSystemTheme={item.canEditSystemTheme}
                  isFocused={selectedIndex === index}
                  refCallback={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  tabIndex={selectedIndex === index ? 0 : -1}
                  onSelect={() => selectItem(index)}
                  onFocus={() => setSelectedIndex(index)}
                  onKeyDown={(event) => handleCardKeyDown(event, index)}
                  onKeyUp={handleCardKeyUp}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeCardSkeleton() {
  return (
    <div className="relative rounded-xl border border-border bg-card/50 p-2">
      <Skeleton className="aspect-4/3 w-full rounded-lg" />
      <div className="mt-3 space-y-2 px-2 pb-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}
