export const PRESENTATION_IMAGE_SEARCH_TOOL_NAME = "search_presentation_images";

export interface PresentationImageSearchResultItem {
  url: string;
  description: string;
  sourceTitle?: string;
  sourceUrl?: string;
}

export interface PresentationImageSearchResult {
  query: string;
  results: PresentationImageSearchResultItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeDescription(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : "Image result";
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function parsePresentationImageSearchResults(
  value: unknown,
): PresentationImageSearchResultItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenUrls = new Set<string>();

  return value.reduce<PresentationImageSearchResultItem[]>((acc, item) => {
    if (!isRecord(item)) {
      return acc;
    }

    const url = normalizeUrl(item.url);
    if (!url || seenUrls.has(url)) {
      return acc;
    }

    seenUrls.add(url);
    acc.push({
      url,
      description: normalizeDescription(item.description),
      sourceTitle: normalizeOptionalText(item.sourceTitle),
      sourceUrl: normalizeOptionalText(item.sourceUrl),
    });
    return acc;
  }, []);
}

export function parsePresentationImageSearchPayload(
  value: unknown,
): PresentationImageSearchResult | null {
  const parsedValue =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;

  if (!isRecord(parsedValue)) {
    return null;
  }

  const query =
    typeof parsedValue.query === "string" && parsedValue.query.trim().length > 0
      ? parsedValue.query.trim()
      : null;

  if (!query) {
    return null;
  }

  return {
    query,
    results: parsePresentationImageSearchResults(parsedValue.results),
  };
}
