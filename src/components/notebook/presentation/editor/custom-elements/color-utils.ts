type PresentationColorFields = {
  color?: unknown;
};

function getColorFields(element: unknown): PresentationColorFields | undefined {
  return typeof element === "object" && element !== null
    ? (element as PresentationColorFields)
    : undefined;
}

export function getPresentationAccentColor(
  element: unknown,
  parentElement: unknown,
  fallback: string,
) {
  const colorFields = getColorFields(element);
  const parentColorFields = getColorFields(parentElement);

  if (typeof colorFields?.color === "string") return colorFields.color;
  if (typeof parentColorFields?.color === "string") {
    return parentColorFields.color;
  }
  return fallback;
}
