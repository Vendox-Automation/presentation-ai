"use client";

import { useMemo } from "react";

import {
  applyThemeToSyntax,
  type InfographicPaletteThemeColors,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import { usePresentationTheme } from "@/components/presentation/providers/PresentationThemeProvider";
import { resolvePresentationThemeData } from "@/lib/presentation/theme-resolution";
import { usePresentationState } from "@/states/presentation-state";

export function useAntvInfographicTheme(syntax?: string) {
  const { resolvedTheme } = usePresentationTheme();
  const isDark = resolvedTheme === "dark";
  const presentationTheme = usePresentationState((state) => state.theme);
  const customThemeData = usePresentationState(
    (state) => state.customThemeData,
  );

  const themeColors = useMemo<InfographicPaletteThemeColors | null>(() => {
    return (
      resolvePresentationThemeData({
        customThemeData,
        theme: presentationTheme,
      })?.colors ?? null
    );
  }, [customThemeData, presentationTheme]);

  const themedSyntax = useMemo(() => {
    return applyThemeToSyntax(syntax ?? "", isDark, themeColors);
  }, [syntax, isDark, themeColors]);

  return { isDark, themedSyntax, themeColors };
}
