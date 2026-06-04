import { type PlateSlide } from "./parser";
import { serializeSlideToXml } from "./slide-serializer";
import { TEMPLATE_DEFINITIONS } from "./templates";

type SerializedLayoutPromptItem = {
  id: string;
  xml: string;
};

type SerializeLayoutAssignmentsOptions = {
  layoutIds: string[];
  outlineItemIds?: string[];
  overrides?: Record<string, string | null>;
};

function createLayoutLookup(): Map<
  string,
  (typeof TEMPLATE_DEFINITIONS)[number]
> {
  const layoutById = new Map<string, (typeof TEMPLATE_DEFINITIONS)[number]>();

  for (const layout of TEMPLATE_DEFINITIONS) {
    layoutById.set(layout.id, layout);

    for (const legacyId of layout.legacyIds ?? []) {
      layoutById.set(legacyId, layout);
    }
  }

  return layoutById;
}

function uniqueLayoutIds(layoutIds: readonly string[]): string[] {
  return [
    ...new Set(layoutIds.filter((layoutId) => layoutId.trim().length > 0)),
  ];
}

function getLayoutsById(layoutIds: string[]): SerializedLayoutPromptItem[] {
  const layoutById = createLayoutLookup();

  return uniqueLayoutIds(layoutIds).flatMap((layoutId) => {
    const layout = layoutById.get(layoutId);

    if (!layout) {
      return [];
    }

    const slide: PlateSlide = {
      id: "",
      ...layout.template,
      content: layout.template.content ?? [],
    };

    return [
      {
        id: layoutId,
        xml: serializeSlideToXml(slide, { mode: "layoutPrompt" }),
      },
    ];
  });
}

function formatLayoutForPrompt(layout: SerializedLayoutPromptItem): string {
  return `\`\`\`xml
${layout.xml}
\`\`\``;
}

function getAssignedLayoutIds(
  overrides: Record<string, string | null>,
): string[] {
  return Object.values(overrides).filter(
    (layoutId): layoutId is string =>
      typeof layoutId === "string" && layoutId.trim().length > 0,
  );
}

export function getBestFitLayoutIds(
  layoutIds: string[],
  overrides: Record<string, string | null> = {},
): string[] {
  const assignedLayoutIds = new Set(getAssignedLayoutIds(overrides));

  return uniqueLayoutIds(layoutIds).filter(
    (layoutId) => !assignedLayoutIds.has(layoutId),
  );
}

export function serializeLayoutsForPrompt(layoutIds: string[]): string {
  const layouts = getLayoutsById(layoutIds);

  if (layouts.length === 0) {
    return "";
  }

  return `Selected XML layouts:
Use every selected XML layout exactly once on the slide where it best fits the outline, unless a slide-specific assignment says otherwise.
Preserve each selected layout's XML tags, attributes, order, and nesting. Replace every instructional placeholder with slide-specific content.

${layouts.map(formatLayoutForPrompt).join("\n\n")}`;
}

export function serializeLayoutAssignmentsForPrompt({
  layoutIds,
  outlineItemIds = [],
  overrides = {},
}: SerializeLayoutAssignmentsOptions): Record<number, string> {
  const layoutDetails = new Map(
    getLayoutsById([...layoutIds, ...getAssignedLayoutIds(overrides)]).map(
      (layout) => [layout.id, formatLayoutForPrompt(layout)],
    ),
  );
  const hints: Record<number, string> = {};

  outlineItemIds.forEach((outlineId, index) => {
    const layoutId = overrides[outlineId];

    if (!layoutId) {
      return;
    }

    const layoutDetail = layoutDetails.get(layoutId);
    if (layoutDetail) {
      hints[index] = layoutDetail;
    }
  });

  for (const [key, layoutId] of Object.entries(overrides)) {
    const parsedIndex = Number.parseInt(key, 10);
    const index = key === "0" ? 0 : parsedIndex - 1;

    if (!Number.isInteger(index) || index < 0 || !layoutId || hints[index]) {
      continue;
    }

    const layoutDetail = layoutDetails.get(layoutId);
    if (layoutDetail) {
      hints[index] = layoutDetail;
    }
  }

  return hints;
}
