import { type ThemeProperties, type Themes } from "@/lib/presentation/themes";
import { resolvePresentationThemeData } from "./theme-resolution";

export function resolvePresentationImageTheme(
  theme: Themes | string,
  customThemeData: ThemeProperties | null,
): ThemeProperties | null {
  return resolvePresentationThemeData({ customThemeData, theme });
}

export function buildPresentationThemedImagePrompt(
  prompt: string,
  theme: ThemeProperties | null,
): string {
  const trimmedPrompt = prompt.trim();
  if (!theme) {
    return trimmedPrompt;
  }

  const { colors, mode, description } = theme;
  const paletteParts = [
    colors?.background ? `background ${colors.background}` : null,
    colors?.primary ? `primary ${colors.primary}` : null,
    colors?.accent ? `accent ${colors.accent}` : null,
    colors?.heading ? `highlight ${colors.heading}` : null,
  ].filter((part): part is string => Boolean(part));
  const mood = mode === "dark" ? "dark, moody" : "bright, clean";
  const promptParts = [
    trimmedPrompt,
    description ? `${description.toLowerCase()} aesthetic` : null,
    `${mood} atmosphere`,
    paletteParts.length > 0
      ? `color palette: ${paletteParts.join(", ")}`
      : null,
  ].filter((part): part is string => Boolean(part));

  return promptParts.join(", ");
}
