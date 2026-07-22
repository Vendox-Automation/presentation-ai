"use server";

import * as z from "zod";

import { env } from "@/env";
import { createLogger } from "@/lib/observability/logger";
import { modelPicker } from "@/lib/modelPicker";
import { type ThemeProperties } from "@/lib/presentation/themes";
import { auth } from "@/server/auth";
import { createCustomTheme } from "./theme-actions";

const logger = createLogger("skill-theme-import");

// Max characters of skill text we send to the model. Skill bundles can be
// large (multiple markdown reference files); the design language lives in the
// first several KB, so we cap to keep the request cheap and fast.
const MAX_SKILL_CHARS = 24_000;

/**
 * What the model is asked to return. Colors are accepted as loose strings and
 * normalized/validated afterwards — forcing a strict hex regex in the tool
 * schema tends to make the model fail or retry instead of self-correcting.
 */
const skillExtractionSchema = z.object({
  name: z
    .string()
    .describe("Short, human-friendly theme name derived from the skill."),
  description: z
    .string()
    .describe(
      "One sentence describing the visual direction (mood, typography, use case).",
    ),
  mode: z
    .enum(["light", "dark"])
    .describe("Whether the theme's default background is light or dark."),
  cornerStyle: z
    .enum(["sharp", "soft", "rounded"])
    .describe(
      "Corner treatment implied by the design language: 'sharp' for Swiss/right-angle styles, 'rounded' for friendly/soft styles, 'soft' for a subtle radius.",
    ),
  colors: z.object({
    primary: z.string().describe("Main brand/action color, hex."),
    accent: z.string().describe("Secondary accent color, hex."),
    background: z.string().describe("Main slide background color, hex."),
    text: z.string().describe("Body text color, hex."),
    heading: z.string().describe("Heading text color, hex."),
    smartLayout: z
      .string()
      .describe("Fill color for diagrams/charts/smart layouts, hex."),
    cardBackground: z.string().describe("Card/container surface color, hex."),
  }),
  fonts: z.object({
    heading: z
      .string()
      .describe(
        "A single, real, well-known heading font family name (e.g. Inter, Playfair Display). Not a comma-separated stack.",
      ),
    body: z
      .string()
      .describe(
        "A single, real, well-known body font family name (e.g. Inter, Source Sans Pro). Not a comma-separated stack.",
      ),
  }),
});

type SkillExtraction = z.infer<typeof skillExtractionSchema>;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const SHORT_HEX_RE = /^#[0-9a-fA-F]{3}$/;

/** Normalize a model-supplied color into a 6-digit hex, or return null. */
function normalizeHex(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.trim();
  if (HEX_RE.test(v)) return v.toLowerCase();
  if (SHORT_HEX_RE.test(v)) {
    // #abc -> #aabbcc
    const [, r, g, b] = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(v)!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

const CORNER_RADIUS: Record<SkillExtraction["cornerStyle"], string> = {
  sharp: "0",
  soft: "0.25rem",
  rounded: "0.75rem",
};

/**
 * Turn the model's extraction into a fully-valid ThemeProperties object,
 * filling in the structural fields (radius/transitions/shadows) the theme
 * system requires but a skill doesn't specify. Colors are normalized to
 * 6-digit hex; anything unparseable falls back to a mode-appropriate default.
 */
function toThemeProperties(extraction: SkillExtraction): ThemeProperties {
  const isDark = extraction.mode === "dark";
  const fallback = {
    primary: isDark ? "#60a5fa" : "#2563eb",
    accent: isDark ? "#93c5fd" : "#3b82f6",
    background: isDark ? "#111827" : "#ffffff",
    text: isDark ? "#e5e7eb" : "#1f2937",
    heading: isDark ? "#f9fafb" : "#111827",
    smartLayout: isDark ? "#60a5fa" : "#2563eb",
    cardBackground: isDark ? "#1f2937" : "#f3f4f6",
  } as const;

  const colors = {
    primary: normalizeHex(extraction.colors.primary) ?? fallback.primary,
    accent: normalizeHex(extraction.colors.accent) ?? fallback.accent,
    background:
      normalizeHex(extraction.colors.background) ?? fallback.background,
    text: normalizeHex(extraction.colors.text) ?? fallback.text,
    heading: normalizeHex(extraction.colors.heading) ?? fallback.heading,
    smartLayout:
      normalizeHex(extraction.colors.smartLayout) ?? fallback.smartLayout,
    cardBackground:
      normalizeHex(extraction.colors.cardBackground) ?? fallback.cardBackground,
  };

  const radius = CORNER_RADIUS[extraction.cornerStyle];

  return {
    name: extraction.name.slice(0, 80),
    description: extraction.description.slice(0, 240),
    mode: extraction.mode,
    colors,
    fonts: {
      // Skills sometimes describe a font stack; keep only the primary family so
      // font-loading resolves to a single, known family name.
      heading: extraction.fonts.heading.split(",")[0]!.trim(),
      body: extraction.fonts.body.split(",")[0]!.trim(),
    },
    borderRadius: { card: radius, slide: radius, button: radius },
    transitions: { default: "all 0.2s ease-in-out" },
    shadows:
      extraction.cornerStyle === "sharp"
        ? { card: "none", button: "none", slide: "none" }
        : {
            card: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)",
            button: "0 1px 3px rgba(0,0,0,0.12)",
            slide: "0 4px 6px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.08)",
          },
    background: { type: "solid", override: colors.background },
  };
}

const SYSTEM_PROMPT = `You are a design-system extractor for a presentation tool.

You will be given the documentation of a "slide design skill" — instructions and reference notes that describe how to design a deck in a particular visual style (colors, typography, layout philosophy, spacing).

Your job is to distill that skill into a single coherent theme this presentation tool can apply: a color palette, font pairing, light/dark mode, and corner style.

Rules:
- Choose ONE coherent palette. If the skill offers several preset palettes, pick the one it presents as the default or most representative, and mention which in the description.
- Use real, well-known font family names only, and return a SINGLE family per role (not a comma-separated stack). Never invent font names. If the skill names specific fonts, use the primary one; otherwise pick a well-known font that matches the described feel.
- Colors must be 6-digit hex (e.g. #1a2b3c). Ensure heading and text have strong contrast against background and cardBackground.
- Infer 'mode' from whether the skill's default background is light or dark.
- Infer 'cornerStyle': 'sharp' for Swiss/international/right-angle/no-radius styles, 'rounded' for friendly/soft product styles, 'soft' for a subtle radius when unsure.
- The name and description should reflect the skill's own identity, not generic filler.`;

/**
 * Extract a theme from an uploaded slide-design skill's text and save it to the
 * current user's custom themes. Reuses the standard createCustomTheme path so
 * the result behaves like any other theme in "My Themes".
 */
export async function createThemeFromSkill(skillText: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false as const,
        message: "You must be signed in to import a skill.",
      };
    }

    if (!env.OPENROUTER_API_KEY?.trim()) {
      return {
        success: false as const,
        message: "AI import is unavailable: OPENROUTER_API_KEY is not set.",
      };
    }

    const text = skillText?.trim();
    if (!text || text.length < 40) {
      return {
        success: false as const,
        message:
          "That skill file looks empty. Upload a SKILL.md (or a skill .zip) with real content.",
      };
    }

    const truncated = text.slice(0, MAX_SKILL_CHARS);
    logger.info("Extracting theme from skill", {
      chars: truncated.length,
      truncated: text.length > MAX_SKILL_CHARS,
    });

    const model = modelPicker("openai/gpt-4o-mini").withStructuredOutput(
      skillExtractionSchema,
      { name: "extract_theme" },
    );

    const extraction = (await model.invoke([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is the slide-design skill documentation. Extract one coherent theme from it.\n\n---\n${truncated}`,
      },
    ])) as SkillExtraction;

    const themeData = toThemeProperties(extraction);

    logger.info("Skill theme extracted", {
      name: themeData.name,
      mode: themeData.mode,
      cornerStyle: extraction.cornerStyle,
    });

    const result = await createCustomTheme({
      name: themeData.name || "Imported Skill Theme",
      description: themeData.description ?? "",
      themeData,
      isPublic: false,
    });

    if (!result.success) {
      return {
        success: false as const,
        message: result.message ?? "Failed to save the extracted theme.",
      };
    }

    return {
      success: true as const,
      themeId: result.themeId,
      themeData,
      message: `Created theme "${themeData.name}" from the skill.`,
    };
  } catch (error) {
    logger.error("Failed to create theme from skill", error);
    return {
      success: false as const,
      message:
        "Couldn't extract a theme from that skill. Try a different file or check the format.",
    };
  }
}
