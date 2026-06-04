export type InfographicSlideLayout =
  | "left"
  | "right"
  | "vertical"
  | "background"
  | "none";

export type InfographicOrientation = "horizontal" | "vertical" | "flexible";

export function getInfographicOrientationForSlideLayout(
  slideLayoutType?: string,
): InfographicOrientation {
  if (slideLayoutType === "left" || slideLayoutType === "right") {
    return "vertical";
  }

  if (slideLayoutType === "vertical") {
    return "horizontal";
  }

  return "horizontal";
}

export function buildInfographicLayoutInstruction(
  slideLayoutType?: string,
): string {
  const orientation = getInfographicOrientationForSlideLayout(slideLayoutType);

  if (orientation === "vertical") {
    return [
      "Required infographic orientation: vertical.",
      "Use a portrait/stacked composition that fits a narrow content column beside a side root image.",
      "Choose top-to-bottom templates such as sequence-roadmap-vertical-*, relation-dagre-flow-tb-*, list-column-*, hierarchy-tree-* or compact stacked hierarchy/list templates.",
      "Do not choose wide left-to-right templates such as compare-binary-horizontal-*, relation-dagre-flow-lr-*, list-row-*, or sequence-horizontal-*.",
    ].join(" ");
  }

  return [
    "Required infographic orientation: horizontal.",
    "Use a landscape/wide composition for the full-width content area, especially when the slide uses a vertical/top root-image layout.",
    "Choose left-to-right, row, grid, quadrant, or landscape templates such as relation-dagre-flow-lr-*, list-row-*, list-grid-*, compare-binary-horizontal-*, quadrant-*, sequence-horizontal-*, sequence-steps-*, sequence-timeline-* or horizontal snake/zigzag templates.",
    "Do not choose tall vertical roadmap/list-column templates such as sequence-roadmap-vertical-* or list-column-*.",
  ].join(" ");
}

function isInfographicTemplateCompatibleWithOrientation(
  templateName: string,
  orientation: InfographicOrientation,
): boolean {
  if (orientation === "flexible") {
    return true;
  }

  if (orientation === "vertical") {
    return ![
      "compare-binary-horizontal-",
      "compare-hierarchy-left-right-",
      "list-row-",
      "relation-dagre-flow-lr-",
      "sequence-horizontal-",
    ].some((prefix) => templateName.startsWith(prefix));
  }

  return ![
    "list-column-",
    "relation-dagre-flow-tb-",
    "sequence-roadmap-vertical-",
  ].some((prefix) => templateName.startsWith(prefix));
}

export function filterInfographicTemplatesForOrientation(
  templateNames: string[],
  orientation: InfographicOrientation,
): string[] {
  const compatibleTemplates = templateNames.filter((templateName) =>
    isInfographicTemplateCompatibleWithOrientation(templateName, orientation),
  );

  return compatibleTemplates.length > 0 ? compatibleTemplates : templateNames;
}
