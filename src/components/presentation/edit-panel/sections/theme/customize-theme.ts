"use client";

import { nanoid } from "nanoid";

import { resolvePresentationThemeData } from "@/lib/presentation/theme-resolution";
import { themes } from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { useThemePanelState } from "./theme-panel-state";

export function openThemeCustomizer() {
  const { setEditingTheme, setIsCustomizing, setOpenCreateThemeModal } =
    useThemePanelState.getState();
  const { theme, customThemeData, generatedThemeData } =
    usePresentationState.getState();
  const builtInTheme = themes[theme as keyof typeof themes];
  const themeData = resolvePresentationThemeData({ customThemeData, theme });
  const baseThemeData =
    (theme === "auto" ? generatedThemeData : null) ??
    resolvePresentationThemeData({ customThemeData: null, theme }) ??
    themeData;

  if (!themeData) {
    console.error("Could not find theme data for:", theme);
    return;
  }

  const themeName =
    builtInTheme?.name ||
    themeData.name ||
    customThemeData?.name ||
    "Custom Theme";

  setEditingTheme({
    id: nanoid(),
    name: themeName,
    description: themeData.description,
    themeData,
    baseThemeData: baseThemeData ?? themeData,
    isPublic: false,
    logoUrl: null,
    userId: "",
  });
  setIsCustomizing(true);
  setOpenCreateThemeModal(true);
}
