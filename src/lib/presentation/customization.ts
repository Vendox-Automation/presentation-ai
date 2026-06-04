import {
  type ThemeBackground,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { type PresentationGenerationAspectRatio } from "./aspect-ratio";
import {
  isBuiltInPresentationTheme,
  resolvePresentationThemeData,
  type PresentationThemeSelectionSource,
} from "./theme-resolution";

export type PresentationCustomization = {
  themeData?: ThemeProperties | null;
  themeDataByTheme?: Record<string, ThemeProperties | null | undefined>;
  generatedThemeData?: ThemeProperties | null;
  themeSource?: PresentationThemeSelectionSource;
  pageStyle?: string | null;
  presentationStyle?: string | null;
  generationAspectRatio?: PresentationGenerationAspectRatio;
  textContent?: "minimal" | "concise" | "detailed" | "extensive";
  tone?:
    | "auto"
    | "general"
    | "persuasive"
    | "inspiring"
    | "instructive"
    | "engaging";
  audience?:
    | "auto"
    | "general"
    | "business"
    | "investor"
    | "teacher"
    | "student";
  scenario?:
    | "auto"
    | "general"
    | "analysis-report"
    | "teaching-training"
    | "promotional-materials"
    | "public-speeches";
  pageBackground?: {
    override?: string | null;
    type?: ThemeBackground["type"];
    gradient?: ThemeBackground["gradient"];
    imageUrl?: string | null;
  };
  selectedSlideTemplates?: string[];
  outlineItemIds?: string[];
  outlineTemplateOverrides?: Record<string, string | null>;
};

export type PresentationCustomizationState = {
  customThemeData: ThemeProperties | null;
  themeDataByTheme?: Record<string, ThemeProperties | null | undefined>;
  generatedThemeData?: ThemeProperties | null;
  theme?: string | null;
  pageStyle: string;
  presentationStyle: string;
  generationAspectRatio: PresentationGenerationAspectRatio;
  textContent: "minimal" | "concise" | "detailed" | "extensive";
  tone:
    | "auto"
    | "general"
    | "persuasive"
    | "inspiring"
    | "instructive"
    | "engaging";
  audience:
    | "auto"
    | "general"
    | "business"
    | "investor"
    | "teacher"
    | "student";
  scenario:
    | "auto"
    | "general"
    | "analysis-report"
    | "teaching-training"
    | "promotional-materials"
    | "public-speeches";
  pageBackground: Record<string, unknown>;
  selectedSlideTemplates?: string[];
  outlineItemIds?: string[];
  outlineTemplateOverrides?: Record<string, string | null>;
};

export function getPresentationCustomization(
  value: unknown,
): PresentationCustomization | null {
  if (!value || typeof value !== "object") return null;
  return value as PresentationCustomization;
}

export function buildPresentationCustomization(
  state: PresentationCustomizationState,
): PresentationCustomization {
  const isUserTheme =
    typeof state.theme === "string" &&
    state.theme.length > 0 &&
    state.theme !== "auto" &&
    !isBuiltInPresentationTheme(state.theme);
  const customization: PresentationCustomization = {
    generatedThemeData: state.generatedThemeData ?? undefined,
    pageStyle: state.pageStyle ?? undefined,
    presentationStyle: state.presentationStyle ?? undefined,
    generationAspectRatio: state.generationAspectRatio,
    textContent: state.textContent,
    tone: state.tone,
    audience: state.audience,
    scenario: state.scenario,
  };

  if (state.theme !== undefined) {
    customization.themeSource = state.theme === "auto" ? "auto" : "selected";
  }

  const themeDataByTheme = { ...(state.themeDataByTheme ?? {}) };

  if (state.customThemeData && state.theme && !isUserTheme) {
    themeDataByTheme[state.theme] = state.customThemeData;
  }

  if (Object.keys(themeDataByTheme).length > 0) {
    customization.themeDataByTheme = {
      ...themeDataByTheme,
    };
  }

  if (state.customThemeData && state.theme === undefined) {
    customization.themeData = state.customThemeData;
  }

  const pageBackground = extractPageBackgroundFromConfig(state.pageBackground);
  if (pageBackground) {
    customization.pageBackground = pageBackground;
  }

  if (state.selectedSlideTemplates && state.selectedSlideTemplates.length > 0) {
    customization.selectedSlideTemplates = state.selectedSlideTemplates;
  }

  if (state.outlineItemIds && state.outlineItemIds.length > 0) {
    customization.outlineItemIds = state.outlineItemIds;
  }

  if (
    state.outlineTemplateOverrides &&
    Object.keys(state.outlineTemplateOverrides).length > 0
  ) {
    customization.outlineTemplateOverrides = state.outlineTemplateOverrides;
  }

  return customization;
}

export function normalizeSelectedSlideTemplates(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function normalizeOutlineTemplateOverrides(
  value: unknown,
): Record<string, string | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string | null>>(
    (overrides, [key, templateId]) => {
      if (typeof templateId === "string" || templateId === null) {
        overrides[key] = templateId;
      }

      return overrides;
    },
    {},
  );
}

export function getPresentationThemeCustomization(
  customization: PresentationCustomization | null | undefined,
  theme: string | null | undefined,
  options: { includeLegacyThemeData?: boolean } = {},
): ThemeProperties | null {
  if (!customization) {
    return null;
  }

  if (theme && customization.themeDataByTheme?.[theme]) {
    return resolvePresentationThemeData({
      customThemeData: customization.themeDataByTheme[theme],
      theme: null,
    });
  }

  if (theme && options.includeLegacyThemeData === false) {
    return null;
  }

  return resolvePresentationThemeData({
    customThemeData: customization.themeData,
    theme: null,
  });
}

export function getPresentationThemeDataByTheme(
  customization: PresentationCustomization | null | undefined,
): Record<string, ThemeProperties | null | undefined> {
  const themeDataByTheme = customization?.themeDataByTheme;

  if (!themeDataByTheme || typeof themeDataByTheme !== "object") {
    return {};
  }

  return Object.entries(themeDataByTheme).reduce<
    Record<string, ThemeProperties | null | undefined>
  >((acc, [theme, themeData]) => {
    if (themeData === null) {
      acc[theme] = null;
      return acc;
    }

    const parsed = resolvePresentationThemeData({
      customThemeData: themeData,
      theme: null,
    });
    if (parsed) {
      acc[theme] = parsed;
    }

    return acc;
  }, {});
}

function extractPageBackgroundFromConfig(
  config: Record<string, unknown>,
): PresentationCustomization["pageBackground"] | null {
  if (!config) return null;

  const override =
    typeof config.backgroundOverride === "string"
      ? (config.backgroundOverride as string)
      : null;
  const type =
    typeof config.backgroundType === "string"
      ? (config.backgroundType as ThemeBackground["type"])
      : undefined;
  const gradient = config.backgroundGradient as ThemeBackground["gradient"];
  const imageUrl =
    typeof config.backgroundImageUrl === "string"
      ? (config.backgroundImageUrl as string)
      : null;

  if (!override && !type && !gradient && !imageUrl) return null;

  return {
    override: override ?? undefined,
    type,
    gradient,
    imageUrl: imageUrl ?? undefined,
  };
}

export function applyPageBackgroundToConfig(
  pageBackground:
    | PresentationCustomization["pageBackground"]
    | null
    | undefined,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (!pageBackground) return config;

  const next = { ...(config ?? {}) };

  delete next.backgroundOverride;
  delete next.backgroundType;
  delete next.backgroundGradient;
  delete next.backgroundImageUrl;

  if (pageBackground.type) next.backgroundType = pageBackground.type;
  if (pageBackground.override)
    next.backgroundOverride = pageBackground.override;
  if (pageBackground.gradient)
    next.backgroundGradient = pageBackground.gradient;
  if (pageBackground.imageUrl)
    next.backgroundImageUrl = pageBackground.imageUrl;

  return next;
}
