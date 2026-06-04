"use client";

import fontInfos from "@/components/ui/font-picker/font-preview/fontInfo.json";
import { type Font } from "@/components/ui/font-picker/types";
import {
  getFourVariants,
  loadFontFromObject,
} from "@/components/ui/font-picker/utils/utils";

type FontInfo = Omit<Font, "cased">;

const GENERIC_FONT_FAMILIES = new Set([
  "arial",
  "cursive",
  "emoji",
  "fantasy",
  "fangsong",
  "inherit",
  "initial",
  "monospace",
  "sans-serif",
  "serif",
  "system-ui",
  "ui-monospace",
  "ui-rounded",
  "ui-sans-serif",
  "ui-serif",
  "unset",
]);

const GOOGLE_FONTS = (fontInfos as FontInfo[]).map((font) => ({
  ...font,
  cased: font.name.toLowerCase(),
}));

const GOOGLE_FONTS_BY_NAME = new Map(
  GOOGLE_FONTS.map((font) => [font.cased, font]),
);

export function loadInfographicFonts(payload: unknown): boolean {
  if (typeof document === "undefined") return false;

  const fontFamilies = extractInfographicFontFamilies(payload);
  let loadedFont = false;

  for (const fontFamily of fontFamilies) {
    const font = GOOGLE_FONTS_BY_NAME.get(fontFamily.toLowerCase());
    if (!font) continue;

    loadFontFromObject(font, false, getFourVariants);
    loadedFont = true;
  }

  return loadedFont;
}

function extractInfographicFontFamilies(payload: unknown): string[] {
  const fonts = new Set<string>();
  collectFonts(payload, fonts);

  return [...fonts];
}

function collectFonts(value: unknown, fonts: Set<string>): void {
  if (!value) return;

  if (typeof value === "string") {
    collectSyntaxFonts(value, fonts);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectFonts(item, fonts);
    }
    return;
  }

  if (typeof value !== "object") return;

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isFontFamilyKey(key) && typeof nestedValue === "string") {
      addFontFamilies(nestedValue, fonts);
      continue;
    }

    collectFonts(nestedValue, fonts);
  }
}

function collectSyntaxFonts(syntax: string, fonts: Set<string>): void {
  const fontFamilyMatches = syntax.matchAll(
    /(?:font-family|fontFamily)\s+([^\n\r]+)/gi,
  );

  for (const match of fontFamilyMatches) {
    const fontFamily = match[1];
    if (fontFamily) addFontFamilies(fontFamily, fonts);
  }
}

function isFontFamilyKey(key: string): boolean {
  return key === "fontFamily" || key === "font-family";
}

function addFontFamilies(value: string, fonts: Set<string>): void {
  for (const fontFamily of normalizeFontFamilies(value)) {
    fonts.add(fontFamily);
  }
}

function normalizeFontFamilies(value: string): string[] {
  return value
    .split(",")
    .map((fontFamily) => fontFamily.trim().replace(/^["']|["']$/g, ""))
    .filter((fontFamily) => {
      if (!fontFamily) return false;
      return !GENERIC_FONT_FAMILIES.has(fontFamily.toLowerCase());
    });
}
