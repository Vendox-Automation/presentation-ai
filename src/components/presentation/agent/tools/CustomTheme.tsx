"use client";

import { Check, Loader2, Palette } from "lucide-react";

import { type PresentationAiThemeProperties } from "@/lib/presentation/theme-schema";
import { type ThemeProperties } from "@/lib/presentation/themes";

type CustomThemePreviewData =
  | PresentationAiThemeProperties
  | Partial<ThemeProperties>;

function ThemeSwatches({ themeData }: { themeData?: CustomThemePreviewData }) {
  const colors = themeData?.colors;
  if (!colors) {
    return null;
  }

  const swatches = [
    colors.primary,
    colors.accent,
    colors.background,
    colors.heading,
    colors.text,
  ].filter((color): color is string => typeof color === "string");

  if (swatches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {swatches.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="h-4 w-4 rounded-full border"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function PresentationCustomThemeCall({
  themeData,
  loading,
}: {
  themeData?: CustomThemePreviewData;
  loading?: boolean;
}) {
  const headingFont = themeData?.fonts?.heading;
  const bodyFont = themeData?.fonts?.body;
  const fontLabels = [headingFont, bodyFont].filter(
    (font): font is string => typeof font === "string" && font.length > 0,
  );

  return (
    <div className="w-full rounded-lg border bg-card p-3 shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          {loading ? (
            <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Palette className="mt-0.5 h-4 w-4 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {themeData?.name ?? "Custom theme"}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {loading ? "Preparing theme..." : "Creating custom theme"}
            </div>
            {themeData ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {fontLabels.map((font, index) => (
                  <span key={`${font}-${index}`}>{font}</span>
                ))}
                <ThemeSwatches themeData={themeData} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PresentationCustomThemeResult({
  message,
}: {
  message?: string;
}) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950/20">
      <span className="inline-flex items-center gap-2 text-sm text-green-900 dark:text-green-100">
        <Check className="h-4 w-4" />
        {message ?? "Custom theme applied"}
      </span>
    </div>
  );
}
