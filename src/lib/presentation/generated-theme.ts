import {
  type ThemeBorderRadius,
  type ThemeColors,
  type ThemeFonts,
  type ThemeMode,
  type ThemeProperties,
  type ThemeShadows,
} from "./themes";

const THEME_XML_PATTERN = /<THEME\b[^>]*>[\s\S]*?<\/THEME>/i;
const PARTIAL_THEME_XML_PATTERN = /<THEME\b[^>]*>[\s\S]*$/i;
const PARTIAL_THEME_OPEN_TAG_PATTERN = /<T(?:H(?:E(?:M(?:E)?)?)?)?$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

type GeneratedThemeColors = Pick<
  ThemeColors,
  | "accent"
  | "background"
  | "cardBackground"
  | "heading"
  | "primary"
  | "smartLayout"
  | "text"
>;

function extractTagValue(xml: string, tagName: string): string | null {
  const match = xml.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match?.[1]?.trim() ?? null;
}

function normalizeHexColor(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed.toUpperCase() : null;
}

function getColor(
  xml: string,
  tagName: keyof GeneratedThemeColors,
): string | null {
  return normalizeHexColor(extractTagValue(xml, tagName));
}

function getTextValue(xml: string, tagName: string, fallback: string): string {
  const value = extractTagValue(xml, tagName);
  return value && value.length > 0 ? value : fallback;
}

function getWeightValue(
  xml: string,
  tagName: string,
  fallback: number,
): number {
  const value = Number.parseInt(extractTagValue(xml, tagName) ?? "", 10);
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(900, Math.max(100, Math.round(value / 100) * 100));
}

function hexToRgb(hex: string): { blue: number; green: number; red: number } {
  const normalized = hex.replace("#", "");
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const { red, green, blue } = hexToRgb(hex);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function buildGeneratedTheme(
  colors: GeneratedThemeColors,
  xml: string,
): ThemeProperties {
  const rawMode = extractTagValue(xml, "mode")?.toLowerCase();
  const mode: ThemeMode = rawMode === "dark" ? "dark" : "light";
  const name = extractTagValue(xml, "name") ?? "AI Generated";
  const description =
    extractTagValue(xml, "description") ??
    "Generated from the presentation outline";
  const fonts: ThemeFonts = {
    heading: getTextValue(xml, "headingFont", "Inter"),
    body: getTextValue(xml, "bodyFont", "Inter"),
    headingWeight: getWeightValue(xml, "headingWeight", 700),
    bodyWeight: getWeightValue(xml, "bodyWeight", 400),
  };
  const borderRadius: ThemeBorderRadius = {
    card: getTextValue(xml, "cardRadius", "0.75rem"),
    slide: getTextValue(xml, "slideRadius", "1rem"),
    button: getTextValue(xml, "buttonRadius", "0.17rem"),
  };
  const shadows: ThemeShadows = {
    card:
      extractTagValue(xml, "cardShadow") ??
      `0 8px 24px ${rgba(colors.primary, 0.12)}, 0 1px 2px rgba(0,0,0,0.08)`,
    button:
      extractTagValue(xml, "buttonShadow") ??
      `0 2px 8px ${rgba(colors.primary, 0.18)}`,
    slide:
      extractTagValue(xml, "slideShadow") ??
      `0 16px 48px ${rgba(colors.primary, 0.14)}, 0 4px 12px rgba(0,0,0,0.08)`,
  };

  return {
    name,
    description,
    mode,
    colors,
    fonts,
    borderRadius,
    transitions: { default: "all 0.2s ease-in-out" },
    shadows,
    background: {
      type: "radial",
      override: `
        radial-gradient(circle at 12% 12%, ${colors.primary}18 0%, transparent 34%),
        radial-gradient(circle at 86% 18%, ${colors.accent}18 0%, transparent 38%),
        ${colors.background}
      `,
    },
  };
}

export function extractGeneratedPresentationTheme(input: string): {
  cleanContent: string;
  themeData: ThemeProperties | null;
} {
  const match = input.match(THEME_XML_PATTERN);
  if (!match?.[0]) {
    return {
      cleanContent: input
        .replace(PARTIAL_THEME_XML_PATTERN, "")
        .replace(PARTIAL_THEME_OPEN_TAG_PATTERN, "")
        .trim(),
      themeData: null,
    };
  }

  const xml = match[0];
  const colors: GeneratedThemeColors = {
    primary: getColor(xml, "primary") ?? "",
    accent: getColor(xml, "accent") ?? "",
    background: getColor(xml, "background") ?? "",
    text: getColor(xml, "text") ?? "",
    heading: getColor(xml, "heading") ?? "",
    smartLayout: getColor(xml, "smartLayout") ?? "",
    cardBackground: getColor(xml, "cardBackground") ?? "",
  };

  const hasAllColors = Object.values(colors).every((color) => color.length > 0);
  const cleanContent = input
    .replace(THEME_XML_PATTERN, "")
    .replace(PARTIAL_THEME_XML_PATTERN, "")
    .replace(PARTIAL_THEME_OPEN_TAG_PATTERN, "")
    .trim();

  if (!hasAllColors) {
    return { cleanContent, themeData: null };
  }

  return {
    cleanContent,
    themeData: buildGeneratedTheme(colors, xml),
  };
}
