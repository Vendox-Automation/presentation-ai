import { useEffect, useRef, useState } from "react";

import { FontLoader } from "@/components/plate/utils/font-loader";
import { usePresentationTheme } from "@/components/presentation/providers/PresentationThemeProvider";
import { resolvePresentationThemeData } from "@/lib/presentation/theme-resolution";
import {
  setThemeVariables,
  type ThemeProperties,
  type themes,
} from "@/lib/presentation/themes";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

interface ThemeBackgroundProps {
  className?: string;
  children: React.ReactNode;
  themeOverride?: keyof typeof themes;
  themeModeOverride?: "light" | "dark";
  themeDataOverride?: ThemeProperties;
  suppressThemeUpdates?: boolean;
  ignorePageBackgroundOverride?: boolean;
}

export function ThemeBackground({
  className,
  children,
  themeOverride,
  themeModeOverride,
  themeDataOverride,
  suppressThemeUpdates,
  ignorePageBackgroundOverride = false,
}: ThemeBackgroundProps) {
  const presentationTheme = usePresentationState((s) => s.theme);
  const customThemeData = usePresentationState((s) => s.customThemeData);
  // Use our custom presentation theme hook for isolated theme control
  const { resolvedTheme, setTheme: setPresentationThemeMode } =
    usePresentationTheme();
  const pageBackground = usePresentationState((s) => s.pageBackground);
  const themeBackgroundRef = useRef<HTMLDivElement>(null);

  const theme = themeOverride ?? presentationTheme;
  const themeData =
    themeDataOverride ??
    resolvePresentationThemeData({ customThemeData, theme });
  const themeMode = themeModeOverride ?? themeData?.mode ?? resolvedTheme;

  const isDark = themeMode === "dark";
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch by only rendering the gradient after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme variables whenever presentation theme or dark mode changes
  useEffect(() => {
    if (mounted && (theme || themeData)) {
      // Check if we're using a custom theme or a predefined theme
      if (themeData) {
        setThemeVariables(themeData, themeBackgroundRef.current ?? undefined);
      }
    }
  }, [theme, JSON.stringify(themeData), isDark, mounted]);

  // Sync the theme mode with the presentation theme
  // When inside /presentation route, this sets the isolated presentation theme
  // When elsewhere, this would set the global theme (existing behavior for other use cases)
  useEffect(() => {
    if (!mounted || !theme || suppressThemeUpdates) return;

    let currentThemeData: ThemeProperties | null = null;

    // Get the current theme data
    currentThemeData = themeData ?? null;

    // Sync the theme mode to match presentation theme mode
    if (currentThemeData) {
      const presentationThemeMode = currentThemeData.mode;
      if (resolvedTheme !== presentationThemeMode) {
        setPresentationThemeMode(presentationThemeMode);
      }
    }
  }, [
    theme,
    themeData,
    mounted,
    resolvedTheme,
    setPresentationThemeMode,
    suppressThemeUpdates,
  ]);

  // Get the current theme colors
  const currentTheme: ThemeProperties | undefined = themeData ?? undefined;

  if (!currentTheme || !mounted) {
    return (
      <div className={cn("h-max min-h-full w-full bg-background", className)}>
        {children}
      </div>
    );
  }

  const colors = currentTheme.colors;

  // Get theme-level background configuration
  const themeBackground = currentTheme.background;

  // Use theme background or fallback to neutral color
  // Note: We don't use colors.background here because that's the slide color,
  // and we want the theme background to be independent
  const computedBackground =
    (!ignorePageBackgroundOverride && pageBackground.backgroundOverride) ||
    themeBackground?.override || // Theme background
    (isDark ? "#0a0a0a" : "#ffffff"); // Neutral fallback (not tied to slide color)

  const gradientStyle = {
    background: computedBackground,
    transition: currentTheme.transitions.default,
    color: colors.text,
  } as React.CSSProperties;

  return (
    <div
      className={cn("theme-background h-max min-h-full w-full", className)}
      style={gradientStyle}
      ref={themeBackgroundRef}
    >
      <FontLoader
        fontsToLoad={[currentTheme.fonts.heading, currentTheme.fonts.body]}
      />
      {children}
    </div>
  );
}
